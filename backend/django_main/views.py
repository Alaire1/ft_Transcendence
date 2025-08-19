from django.shortcuts import redirect
from django.http import JsonResponse
from .models import FormData
import json
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def test_view(request):
    if request.method == 'POST':
        try:
            # Parse JSON body
            data = json.loads(request.body)
            name = data.get('name')
            message = data.get('message')

            if not name or not message:
                return JsonResponse({"success": False, "error": "Missing name or message."}, status=400)

            # Save to the database
            form_data = FormData(name=name, message=message)
            form_data.save()

            return JsonResponse({"success": True, "message": "Data saved successfully."}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON payload."}, status=400)
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
    elif request.method == 'GET':
        try:
            # Retrieve all data from the database
            all_data = list(FormData.objects.values())
            return JsonResponse({"success": True, "all_data": all_data}, status=200)
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
    else:
        return JsonResponse({"success": False, "error": "Invalid request method."}, status=405)
                                                                                                                                                     


def pong_game(request):
    # Redirect to the frontend service's game page through Nginx
    return redirect('/game/')

