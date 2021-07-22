from django.db import models
from datetime import datetime

# Create your models here.
class Memories(models.Model):
	username = models.CharField(max_length=150)
	date     = models.DateTimeField(default=datetime.now)
	memory   = models.TextField()