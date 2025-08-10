#!/bin/bash

echo -e "\nThis may take a very long time\n"
sleep 5

set -e

echo -e "\n[*] Updating package list...\n"
opkg update

echo -e "\n[*] Installing tools and dependencies...\n"
opkg install kismet kismet-capture-linux-wifi gpsd gpsd-clients python3 python3-flask python3-pip ca-bundle ca-certificates python3-setuptools
pip3 install --no-cache-dir pandas

echo -e "\n[*] Configuring kismet...\n"
echo "gps=gpsd:host=localhost,port=2947" >> /etc/kismet/kismet.conf

echo -e "\n[*] Adding evil portals to the portals directory\n"
cp -r ./portals/* ~/portals

echo -e "\n[*] Setup completed, scripts ready for use."
