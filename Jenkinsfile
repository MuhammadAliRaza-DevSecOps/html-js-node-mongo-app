pipeline {
  agent any

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Deploy to EC2 via Ansible') {
      steps {
        sh '''
          echo "Starting deployment..."

          cd $WORKSPACE

          ansible-playbook -i ansible/inventory.ini ansible/deploy.yml

          echo "Deployment Done!"
        '''
      }
    }

  }
}