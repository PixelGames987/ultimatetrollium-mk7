#!/bin/bash

read -p "(1 - edit; 2 - revert): " mode

if [[ $mode == "1" ]]; then
	cp /etc/hosts /etc/hosts.bak
	vim /etc/hosts
elif [[ $mode == "2" ]]; then
	rm -f /etc/hosts
	mv /etc/hosts.bak /etc/hosts
else
	echo "Invalid option"
	exit 1
fi

/etc/init.d/dnsmasq restart
