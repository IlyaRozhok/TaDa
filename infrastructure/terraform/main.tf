terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
  }
  required_version = ">= 1.0"
}

provider "hcloud" {
  token = var.hetzner_token
}

# SSH Key (existing key imported into Terraform state)
data "hcloud_ssh_key" "deploy" {
  fingerprint = "bf:9f:2c:19:56:31:cb:8a:ef:3d:fe:41:fa:1e:53:88"
}

# Firewall
resource "hcloud_firewall" "tada" {
  name = "tada-${var.environment}-firewall"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

# Server
resource "hcloud_server" "tada" {
  name        = "tada-${var.environment}-v2"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location
  ssh_keys    = [data.hcloud_ssh_key.deploy.id]
  firewall_ids = [hcloud_firewall.tada.id]

  user_data = templatefile("${path.module}/cloud-init.yml", {
    db_password = var.db_password
    environment = var.environment
  })

  labels = {
    environment = var.environment
    project     = "tada"
  }
}

# Output
output "server_ip" {
  description = "Public IP of the server"
  value       = hcloud_server.tada.ipv4_address
}

output "server_status" {
  description = "Status of the server"
  value       = hcloud_server.tada.status
}
