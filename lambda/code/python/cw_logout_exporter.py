import os
import boto3
from datetime import datetime, timedelta
import time

LOG = boto3.client("logs")
DEST_BUCKET = os.environ["TARGET_BUCKET"]
PREFIX_BASE = os.environ.get("PREFIX", "")  # 예: "cw-backup"


def lambda_handler(event, context):
    # UTC 기준 전날 00:00 ~ 당일 00:00
    end = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    start = end - timedelta(days=1)
    start_ms = int(start.timestamp() * 1000)
    end_ms = int(end.timestamp() * 1000)

    # Fetch all log group names
    log_groups = []
    paginator = LOG.get_paginator("describe_log_groups")
    for page in paginator.paginate():
        for lg in page["logGroups"]:
            log_groups.append(lg["logGroupName"])

    # Process in batches of up to 5
    BATCH_SIZE = 5
    for i in range(0, len(log_groups), BATCH_SIZE):
        batch = log_groups[i : i + BATCH_SIZE]
        task_names = []
        for lg_name in batch:
            name = lg_name.lstrip("/")
            prefix = f"{PREFIX_BASE}/{name}/{start:%Y/%m/%d}/".lstrip("/")
            task_name = f"{name}-{start:%Y%m%d}"
            try:
                LOG.create_export_task(
                    taskName=task_name,
                    logGroupName=lg_name,
                    **{"from": start_ms, "to": end_ms},
                    destination=DEST_BUCKET,
                    destinationPrefix=prefix,
                )
                task_names.append(task_name)
                print(f"Started export task: {task_name}")
            except LOG.exceptions.ClientError as e:
                print(f"[Error] {task_name}: {e}")

        # Wait for batch to complete
        while True:
            response = LOG.describe_export_tasks()
            active = [
                t
                for t in response.get("exportTasks", [])
                if t.get("taskName") in task_names
                and t.get("status", {}).get("code") in ("PENDING", "RUNNING")
            ]
            if not active:
                break
            time.sleep(10)
