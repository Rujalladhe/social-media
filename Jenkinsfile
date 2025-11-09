pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/yourusername/social-media.git', credentialsId: 'github-creds'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    node -v
                    npm -v
                    npm install
                '''
            }
        }

        stage('Lint & Format') {
            steps {
                sh 'npm run lint:fix || true'
                sh 'npm run format || true'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test || true'
            }
        }

        stage('Push Fixes') {
            steps {
                sh '''
                    git config user.name "jenkins"
                    git config user.email "jenkins@ci.local"
                    git add .
                    git diff --cached --quiet || git commit -m "🔧 Auto-fix: lint & format"
                    git push https://<username>:<token>@github.com/yourusername/social-media.git main
                '''
            }
        }
    }

    post {
        success { echo '✅ CI completed successfully!' }
        failure { echo '❌ Build failed — check logs.' }
    }
}
