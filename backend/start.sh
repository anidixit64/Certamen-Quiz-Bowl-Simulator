#!/bin/bash
gunicorn app:flask_app -w 1 -b 0.0.0.0:8000