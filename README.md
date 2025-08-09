# ultimatetrollium-mk7
A collection of simple bash scripts for the wifi pineapple mk7 made to simplify wifi pentesting using ssh.

How to setup?
```
opkg update
opkg install git

git clone https://github.com/PixelGames987/ultimatetrollium-mk7/
cd ultimatetrollium-mk7

./setup.sh
```

For wardriving you need the android app "GPSd Forwarder", set the ip to 172.16.42.1 and port to 2947

For the dns spoofing website to work you need to stop the web server in the Evil Portal module on the wifi pineapple web interface
