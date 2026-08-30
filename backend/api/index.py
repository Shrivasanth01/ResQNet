import os
import sys

# Ensure both api folder and root backend directory are in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(current_dir)

if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.main import app
