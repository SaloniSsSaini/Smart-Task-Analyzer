from rest_framework import serializers


class TaskInputSerializer(serializers.Serializer):
id = serializers.CharField(required=False, allow_null=True)
title = serializers.CharField(required=True)
due_date = serializers.CharField(required=False, allow_blank=True)
estimated_hours = serializers.FloatField(required=False, allow_null=True)
importance = serializers.FloatField(required=False, min_value=1, max_value=10)
dependencies = serializers.ListField(child=serializers.CharField(), required=False)