resource "aws_sqs_queue" "payment" {
  name = "Payment"
}

resource "aws_cloudwatch_event_rule" "payment_queue" {
  event_bus_name = aws_cloudwatch_event_bus.global.name
  event_pattern  = <<PATTERN
{
  "account": ["${data.aws_caller_identity.current.account_id}"],
  "source": ["warehouse"],
  "detail-type": ["warehouse.stock-reserved"]
}
PATTERN
}

resource "aws_cloudwatch_event_target" "payment_queue" {
  event_bus_name = aws_cloudwatch_event_bus.global.name

  rule = aws_cloudwatch_event_rule.payment_queue.name
  arn  = aws_sqs_queue.payment.arn
}

resource "aws_sqs_queue_policy" "payment_queue" {
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.payment.arn
      }
    ]
  })

  queue_url = aws_sqs_queue.payment.id
}
