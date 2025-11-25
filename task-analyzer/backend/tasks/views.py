from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TaskInputSerializer
from .scoring import compute_scores
from django.http import HttpResponse
import csv
import io


# -----------------------------------------------------
# 1️⃣  ANALYZE VIEW
# -----------------------------------------------------
class TaskAnalyzeView(APIView):
    def post(self, request):
        payload = request.data

        tasks = payload.get('tasks') if isinstance(payload, dict) and 'tasks' in payload else payload
        if not isinstance(tasks, list):
            return Response(
                {'error': 'Expected list of tasks or {tasks: [...]}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        validated = []
        input_errors = []

        for idx, t in enumerate(tasks):
            serializer = TaskInputSerializer(data=t)
            if serializer.is_valid():
                validated.append(serializer.validated_data)
            else:
                input_errors.append({'index': idx, 'errors': serializer.errors})

        strategy = request.query_params.get('strategy', 'smart')

        # custom weights support
        custom_weights = None
        if isinstance(payload, dict) and payload.get('weights'):
            custom_weights = payload.get('weights')

        result = compute_scores(
            validated,
            strategy=strategy,
            custom_weights=custom_weights
        )

        result['input_errors'] = input_errors
        return Response(result)


# -----------------------------------------------------
# 2️⃣  SUGGEST VIEW
# -----------------------------------------------------
class TaskSuggestView(APIView):
    def post(self, request):
        payload = request.data

        tasks = payload.get('tasks') if isinstance(payload, dict) and 'tasks' in payload else payload
        if not isinstance(tasks, list):
            return Response(
                {'error': 'Expected list of tasks or {tasks: [...]}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        strategy = request.query_params.get('strategy', 'smart')
        result = compute_scores(tasks, strategy=strategy)

        top = result['tasks'][:3]

        suggestions = []
        for t in top:
            reasons = '; '.join(t['explanation'][:2])
            suggestions.append({
                'id': t['id'],
                'title': t['title'],
                'score': t['score'],
                'why': reasons
            })

        # Quick alerts
        alerts = []
        overdue = [t for t in result['tasks'] if 'Past due' in ' '.join(t['explanation'])]
        if len(overdue) >= 1:
            alerts.append(f'{len(overdue)} overdue tasks found')

        soon = [t for t in result['tasks'] if t['score'] >= 80]
        if len(soon) >= 3:
            alerts.append('Multiple high priority tasks! Consider reweighting.')

        return Response({
            'suggestions': suggestions,
            'alerts': alerts,
            'cycles': result['cycles']
        })


# -----------------------------------------------------
# 3️⃣  EXPORT CSV VIEW
# -----------------------------------------------------
class ExportCSVView(APIView):
    def post(self, request):
        tasks = request.data.get("tasks", [])

        si = io.StringIO()
        writer = csv.writer(si)

        writer.writerow(["id", "title", "due_date", "estimated_hours", "importance", "score"])

        for t in tasks:
            writer.writerow([
                t.get("id"),
                t.get("title"),
                t.get("due_date"),
                t.get("estimated_hours"),
                t.get("importance"),
                t.get("score")
            ])

        output = si.getvalue()
        return HttpResponse(output, content_type="text/csv")


# -----------------------------------------------------
# 4️⃣  FEEDBACK VIEW (HELPFUL / DONE)
# -----------------------------------------------------
class TaskFeedbackView(APIView):

    feedback_store = {}   # In memory (for demo)

    def post(self, request):
        task_id = request.data.get("task_id")
        label = request.data.get("label")

        if not task_id or not label:
            return Response(
                {"error": "task_id and label are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if task_id not in self.feedback_store:
            self.feedback_store[task_id] = {"helpful": 0, "done": 0}

        if label == "helpful":
            self.feedback_store[task_id]["helpful"] += 1
        elif label == "done":
            self.feedback_store[task_id]["done"] += 1
        else:
            return Response({"error": "Invalid label"}, status=400)

        return Response({
            "message": "Feedback recorded",
            "task_id": task_id,
            "feedback": self.feedback_store[task_id]
        })
