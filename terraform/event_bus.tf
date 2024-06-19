resource "aws_cloudwatch_event_bus" "global" {
  name = "${var.service_name}-global"
}

resource "aws_cloudwatch_event_bus" "loyalty" {
  name = "${var.service_name}-loyalty"
}
