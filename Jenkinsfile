pipeline {
  agent any

  environment {
    DOCKERHUB = credentials('dockerhub-creds')
    DOCKERHUB_USER = "${DOCKERHUB_USR}"
    DOCKERHUB_PASS = "${DOCKERHUB_PSW}"

    BACKEND_IMAGE = "${DOCKERHUB_USER}/private-backend"
    FRONTEND_IMAGE = "${DOCKERHUB_USER}/private-frontend"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Docker Login') {
      steps {
        sh '''
          echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
        '''
      }
    }

    stage('Build Images') {
      steps {
        sh '''
          docker build -t "$BACKEND_IMAGE:latest" ./backend
          docker build -t "$FRONTEND_IMAGE:latest" ./frontend
        '''
      }
    }

    stage('Push Images') {
      steps {
        sh '''
          docker push "$BACKEND_IMAGE:latest"
          docker push "$FRONTEND_IMAGE:latest"
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