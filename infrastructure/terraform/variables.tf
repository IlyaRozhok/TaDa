variable "hetzner_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL password for tada_user"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name (stage, prod)"
  type        = string
  default     = "stage"
}

variable "server_type" {
  description = "Hetzner server type"
  type        = string
  default     = "cx23"
}

variable "location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "nbg1"
}
