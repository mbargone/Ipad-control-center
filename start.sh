#!/bin/bash
cd /home/mbargone/Ipad-control-center
git pull origin feature/dashboard-v1
source venv/bin/activate
python server.py