class LogHostMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log headers
        print("HTTP Headers:")
        for header, value in request.headers.items():
            print(f"{header}: {value}")
        
        # Proceed with the response
        return self.get_response(request)