import os
import sys

# Add root backend directory to sys.path so 'app' module imports cleanly
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

# Expose app for Vercel Serverless Function
app = app
