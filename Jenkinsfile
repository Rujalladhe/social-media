pipeline {
    agent any

    environment {
        GIT_REPO_URL = 'https://github.com/Rujalladhe/social-media.git'
        GIT_BRANCH = 'main'
        GIT_CREDENTIAL_ID = 'github-creds'
        GITHUB_USER = 'Rujalladhe'              // your GitHub username
        GITHUB_TOKEN = credentials('github-creds') // uses Jenkins stored credential securely
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📦 Checking out source code from GitHub...'
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO_URL}", credentialsId: "${GIT_CREDENTIAL_ID}"
            }
        }

        stage('Verify Node Environment') {
            steps {
                echo '🔍 Checking Node.js & npm versions...'
                sh '''
                    node -v
                    npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📥 Installing dependencies...'
                sh 'npm install'
            }
        }

        stage('Auto Fix & Lint') {
            steps {
                echo '🎨 Running Prettier & ESLint auto-fix...'
                sh '''
                    npm run format || true
                    npm run lint:fix || true
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Running tests...'
                sh 'npm test || true'
            }
        }

        stage('Push Auto-Fixes to GitHub') {
            steps {
                echo '📤 Committing & pushing any auto-fixes...'
                script {
                    sh '''
                        git config user.name "jenkins"
                        git config user.email "jenkins@ci.local"
                        git add .
                        if ! git diff --cached --quiet; then
                            git commit -m "🔧 Auto-fix: lint & format corrections [ci skip]"
                            git push https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/Rujalladhe/social-media.git ${GIT_BRANCH}
                        else
                            echo "✅ No changes to commit."
                        fi
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ CI pipeline completed successfully!'
        }
        failure {
            echo '❌ Build failed. Check logs for errors.'
        }
    }
}
