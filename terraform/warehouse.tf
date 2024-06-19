resource "aws_sqs_queue" "warehouse" {
  name                        = "Warehouse.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "queue"
}

resource "aws_cloudwatch_event_rule" "warehouse_queue" {
  event_bus_name = aws_cloudwatch_event_bus.global.name
  event_pattern  = <<PATTERN
{
  "account": ["${data.aws_caller_identity.current.account_id}"],
  "source": ["order", "loyalty"],
  "detail-type": ["order.placed", "loyalty.points-awarded"]
}
PATTERN
}

resource "aws_cloudwatch_event_target" "warehouse_queue" {
  event_bus_name = aws_cloudwatch_event_bus.global.name

  rule = aws_cloudwatch_event_rule.warehouse_queue.name
  arn  = aws_sqs_queue.warehouse.arn

  sqs_target {
    message_group_id = "Warehouse"
  }
}

resource "aws_sqs_queue_policy" "warehouse_queue" {
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.warehouse.arn
      }
    ]
  })

  queue_url = aws_sqs_queue.warehouse.id
}
