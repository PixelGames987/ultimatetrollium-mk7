#!/usr/bin/env python3
import argparse
import csv
import json
import time
from pathlib import Path

def generate_id(index):
    return str(int(time.time() * 1000) + index)

def infer_icon_type(row):
    if "[WPA3" in row.get("AuthMode", ""):
        return "lock"
    if "[WPA2" in row.get("AuthMode", ""):
        return "wifi"
    if "[WEP" in row.get("AuthMode", "") or "[ESS]" in row.get("AuthMode", ""):
        return "alert"
    return "default"

def build_information(row):
    parts = []
    ssid = row.get("SSID")
    if ssid:
        parts.append(f"SSID: {ssid}")
    auth = row.get("AuthMode")
    if auth:
        parts.append(f"AuthMode: {auth}")
    rssi = row.get("RSSI")
    if rssi:
        parts.append(f"Signal strength: {rssi} dBm")
    return ". ".join(parts)

def process_csv(path):
    with open(path, "r", encoding="utf-8", newline="") as f:
        lines = f.readlines()
        lines = lines[1:] if lines[0].startswith("WigleWifi-") else lines
        reader = csv.DictReader(lines)
        output = []
        for i, row in enumerate(reader):
            lat = row.get("CurrentLatitude")
            lon = row.get("CurrentLongitude")
            if not lat or not lon:
                continue
            entry = {
                "id": generate_id(i),
                "name": row.get("SSID") or "Unknown",
                "deviceType": "WiFi AP",
                "information": build_information(row),
                "latitude": float(lat),
                "longitude": float(lon),
                "iconType": infer_icon_type(row)
            }
            output.append(entry)
        return output

def main():
    p = argparse.ArgumentParser(description="Convert WiGLE .wiglecsv to custom JSON format.")
    p.add_argument("input", help="Input .wiglecsv file")
    p.add_argument("-o", "--output", help="Output .json file (default: same name)")
    args = p.parse_args()

    in_path = Path(args.input)
    out_path = Path(args.output) if args.output else in_path.with_suffix(".json")

    data = process_csv(in_path)
    with open(out_path, "w", encoding="utf-8") as out:
        json.dump(data, out, indent=2, ensure_ascii=False)

    print(f"Wrote {len(data)} records to {out_path}")

if __name__ == "__main__":
    main()
