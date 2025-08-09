#!/bin/bash

# This script was partially vibe-coded

echo "Starting..."

KISMET_LOG_DIR="/root/kismet"
KISMET_SESSION_LOG="$KISMET_LOG_DIR/$(date +%Y-%m-%d-%H-%M-%S)-wardrive/kismet-log.txt"
GPSD_DEBUG_LOG="/tmp/gpsd_debug.log"

# Clear previous debug logs
> "$GPSD_DEBUG_LOG"

echo "Stopping and disabling system gpsd service..."
/etc/init.d/gpsd stop 2>/dev/null
/etc/init.d/gpsd disable 2>/dev/null
sleep 1
pkill gpsd
pkill kismet
ifconfig wlan1 down
ifconfig wlan3 down

echo "Starting gpsd..."
# -D 5 for debug messages, -N for no-fork, -G for any host
gpsd -D 5 -N -G udp://172.16.42.1:2947 >"$GPSD_DEBUG_LOG" 2>&1 &
PID_GPSD=$!
sleep 5

echo "Testing gps..."
if ! netstat -tulnp | grep -q 'tcp.*:2947.*LISTEN.*gpsd'; then
    echo "ERROR: gpsd is not listening on TCP port 2947. Aborting."
    kill "$PID_GPSD" 2>/dev/null
    exit 1
fi
echo "gpsd is listening on port 2947."

echo "Waiting for 3D GPS fix (up to 30 seconds)..."
FIX_FOUND=0
TIMEOUT_SECONDS=30

( gpspipe -w | grep -qm 1 '"mode":3' ) &
GPSPIPE_PID=$!

# Wait loop
for ((i=0; i<TIMEOUT_SECONDS; i++)); do
    # Check if the gpspipe process is still running
    if ! kill -0 "$GPSPIPE_PID" 2>/dev/null; then
        wait "$GPSPIPE_PID"
        FIX_RESULT=$?
        if [ "$FIX_RESULT" -eq 0 ]; then
            FIX_FOUND=1
        fi
        break
    fi
    sleep 1
done

# If gpspipe is still running after timeout, kill it
if kill -0 "$GPSPIPE_PID" 2>/dev/null; then
    kill "$GPSPIPE_PID" 2>/dev/null
    wait "$GPSPIPE_PID" 2>/dev/null
fi

if [ "$FIX_FOUND" -eq 1 ]; then
    echo "3D GPS fix acquired."
else
    echo "ERROR: GPSD did not get a 3D fix within $TIMEOUT_SECONDS seconds. Exiting."
    kill "$PID_GPSD" 2>/dev/null
    exit 1
fi

UTCDATE=$(gpspipe -w | grep -m 1 "TPV" | sed -r 's/.*"time":"([^"]*)".*/\1/' | sed -e 's/^\(.\{10\}\)T\(.\{8\}\).*/\1 \2/')
if [ -n "$UTCDATE" ]; then # Check if UTCDATE is not empty
    date -u -s "$UTCDATE"
    echo "System date set to: $(date)"
else
    echo "WARNING: Could not get UTCDATE from gpsd. System date not set."
fi

echo "Setting wifi mode..."
# wlan1 is the built in recon interface, wlan3 is the external wifi card
/usr/sbin/iwconfig wlan1 mode Monitor
/usr/sbin/iwconfig wlan3 mode Monitor

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "ERROR: tmux is not installed. Please install tmux."
    echo "e.g., opkg update; opkg install tmux"
    kill "$PID_GPSD" 2>/dev/null
    exit 1
fi

# Black magic section

SESSION_NAME="wardrive"
tmux has-session -t "$SESSION_NAME" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "Existing tmux session '$SESSION_NAME' found. Killing it..."
    tmux kill-session -t "$SESSION_NAME"
    sleep 1
fi

echo "Starting tmux session for Kismet and gpsmon..."
tmux new-session -s "$SESSION_NAME" -d -n "Main"
tmux split-window -h -t "$SESSION_NAME:0"

tmux send-keys -t "$SESSION_NAME:0.0" "kismet -p $KISMET_LOG_DIR -t wardrive --override wardrive -c wlan1 -c wlan3 -g gpsd:host=localhost,port=2947,reconnect=true" C-m

tmux send-keys -t "$SESSION_NAME:0.1" "gpsmon" C-m

echo "Tmux session '$SESSION_NAME' started. Attaching now."
echo "Use Ctrl+b d to detach from the session."
echo "To reattach later, run: tmux attach -t $SESSION_NAME"
echo "To kill the session and stop processes, run: tmux kill-session -t $SESSION_NAME"

tmux attach -t "$SESSION_NAME"

echo "Tmux session exited. Cleaning up processes..."

pkill kismet 2>/dev/null
pkill gpsd 2>/dev/null

echo "Script finished."
