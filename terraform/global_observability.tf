resource "aws_cloudwatch_event_rule" "global_observability" {
  event_bus_name = aws_cloudwatch_event_bus.global.name

  event_pattern = <<PATTERN
{
  "account": [
    "${data.aws_caller_identity.current.account_id}"
  ]
}
PATTERN
}

// Queue

resource "aws_sqs_queue" "global_observability" {
  name = "GlobalObservability"
}

resource "aws_cloudwatch_event_target" "global_observability_queue" {
  event_bus_name = aws_cloudwatch_event_bus.global.name

  rule = aws_cloudwatch_event_rule.global_observability.name
  arn  = aws_sqs_queue.global_observability.arn
}

resource "aws_sqs_queue_policy" "global_observability_queue" {
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.global_observability.arn
      }
    ]
  })

  queue_url = aws_sqs_queue.global_observability.id
}

// Log Group

resource "aws_cloudwatch_log_group" "global_observability" {
  name = "/aws/events/${var.service_name}-global-observability"
}

resource "aws_cloudwatch_log_resource_policy" "global_observability" {
  policy_name     = "EventBridgeToCloudWatchLogsPolicy"
  policy_document = <<DOCUMENT
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EventBridgeToCloudWatchLogsPolicy",
      "Effect": "Allow",
      "Principal": {
      "Service": [
        "delivery.logs.amazonaws.com",
        "events.amazonaws.com"
      ]
      },
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "${aws_cloudwatch_log_group.global_observability.arn}",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "${aws_cloudwatch_event_rule.global_observability.arn}"
        }
      }
    }
  ]
}
DOCUMENT
}

resource "aws_cloudwatch_event_target" "global_observability_log_group" {
  event_bus_name = aws_cloudwatch_event_bus.global.name

  rule = aws_cloudwatch_event_rule.global_observability.name
  arn  = aws_cloudwatch_log_group.global_observability.arn
}
