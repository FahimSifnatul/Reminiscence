from django.shortcuts import render
from django.views import View
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.core.serializers import serialize
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from datetime import datetime

# custom
from .models import Memories

# Create your views here.
class Home(View):
	@method_decorator(ensure_csrf_cookie)    
	def get(self, request, *args, **kwargs):
		context = {}
		return render(request, "index.html", context)

	def post(self, request, *args, **kwargs):
		if "logout" in request.POST:
			logout(request)
			return HttpResponse("")
		
		elif "new_memory" in request.POST:
			username = request.user.username
			date     = datetime.now()
			memory   = request.POST.get("new_memory")
			
			new_memory = Memories(username=username, date=date, memory=memory)
			new_memory.save()

			context = {
					"user_memories": serialize("json", Memories.objects.filter(username=request.user.username))
			}
			return JsonResponse(context, safe=False)
		
		else:
			username = request.POST.get("username")
			email    = request.POST.get("email")
			password = request.POST.get("password")
			
			user = authenticate(request, username=username, email=email, password=password)

			if user == None: # new writer
				User.objects.create_user(username=username, email=email, password=password)
				user = authenticate(request, username=username, email=email, password=password)

			login(request, user)
			context = {
					"username" : request.user.username, 
					"user_authenticated" : request.user.is_authenticated, 
					"user_memories" : serialize("json", Memories.objects.filter(username=request.user.username))
			}
			return JsonResponse(context, safe=False)
