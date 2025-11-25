# lightweight model kept for potential persistence; not required to run analyzer
from django.db import models


class Task(models.Model):
title = models.CharField(max_length=255)
due_date = models.DateTimeField(null=True, blank=True)
estimated_hours = models.FloatField(null=True, blank=True)
importance = models.IntegerField(default=5)
dependencies = models.JSONField(default=list, blank=True)


def __str__(self):
return self.title