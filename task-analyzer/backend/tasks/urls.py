from .views import TaskAnalyzeView, TaskSuggestView, ExportCSVView, TaskFeedbackView

urlpatterns = [
    path('analyze/', TaskAnalyzeView.as_view(), name='analyze'),
    path('suggest/', TaskSuggestView.as_view(), name='suggest'),
    path('export/', ExportCSVView.as_view(), name='export'),
    path('feedback/', TaskFeedbackView.as_view(), name='feedback'),
]
