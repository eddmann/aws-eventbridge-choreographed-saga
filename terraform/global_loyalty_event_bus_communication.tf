resource "aws_iam_role" "global_loyalty_cross_event_bus" {
  name               = "GlobalLoyaltyCrossEventBus"
  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY

  path = "/service-role/"
}

resource "aws_iam_role_policy" "global_loyalty_cross_event_bus" {
  name = "GlobalLoyaltyCrossEventBus"
  role = aws_iam_role.global_loyalty_cross_event_bus.id

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "events:PutEvents",
      "Resource": [
        "${aws_cloudwatch_event_bus.global.arn}",
        "${aws_cloudwatch_event_bus.loyalty.arn}"
      ]
    }
  ]
}
POLICY
}

resource "aws_cloudwatch_event_rule" "global_to_loyalty" {
  event_bus_name = aws_cloudwatch_event_bus.global.name

  event_pattern = <<PATTERN
{
  "account": ["${data.aws_caller_identity.current.account_id}"],
  "source": ["payment"],
  "detail-type": ["payment.taken"]
}
PATTERN
}

resource "aws_cloudwatch_event_target" "global_to_loyalty" {
  event_bus_name = aws_cloudwatch_event_bus.global.name

  rule     = aws_cloudwatch_event_rule.global_to_loyalty.name
  arn      = aws_cloudwatch_event_bus.loyalty.arn
  role_arn = aws_iam_role.global_loyalty_cross_event_bus.arn
}

resource "aws_cloudwatch_event_rule" "loyalty_to_global" {
  event_bus_name = aws_cloudwatch_event_bus.loyalty.name

  event_pattern = <<PATTERN
{
  "account": ["${data.aws_caller_identity.current.account_id}"],
  "source": ["loyalty"],
  "detail-type": ["loyalty.points-awarded"]
}
PATTERN
}

resource "aws_cloudwatch_event_target" "loyalty_to_global" {
  event_bus_name = aws_cloudwatch_event_bus.loyalty.name

  rule     = aws_cloudwatch_event_rule.loyalty_to_global.name
  arn      = aws_cloudwatch_event_bus.global.arn
  role_arn = aws_iam_role.global_loyalty_cross_event_bus.arn
}
