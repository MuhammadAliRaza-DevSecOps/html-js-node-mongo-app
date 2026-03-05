pipeline {
  agent any

  environment {
    DOCKERHUB_USER = "muhammadali804"
    BACKEND_IMAGE  = "muhammadali804/private-backend"
    FRONTEND_IMAGE = "muhammadali804/private-frontend"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Docker Login') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
          '''
        }
      }
    }

    stage('Build Images') {
      steps {
        sh '''
          docker build -t ${BACKEND_IMAGE}:latest  ./backend
          docker build -t ${FRONTEND_IMAGE}:latest ./frontend
        '''
      }
    }

    stage('Push Images') {
      steps {
        sh '''
          docker push ${BACKEND_IMAGE}:latest
          docker push ${FRONTEND_IMAGE}:latest
        '''
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
    }
  }
}