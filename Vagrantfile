# Specify Vagrant version and Vagrant API version
Vagrant.require_version ">= 1.6.0"
VAGRANTFILE_API_VERSION = "2"

# Create and configure the VM(s)
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  # Always use Vagrant's default insecure key
  config.ssh.insert_key = false

  # Spin up a "host box" for use with the Docker provider
  # and then provision it with Docker
  config.vm.box = "ubuntu/trusty64"
  config.vm.provision "docker"

  #host_ip: "192.168.0.*" cant be used because it screws with docker install
  config.vm.network "forwarded_port", host: 80, guest: 80
end
