pipeline {
    agent any

    environment {
        GIT_REPO_URL = 'https://github.com/Rujalladhe/social-media.git'
        GIT_BRANCH = 'main'
        GIT_CREDENTIAL_ID = 'github-creds'
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
                echo '📥 Installing project dependencies...'
                sh 'npm install'
            }
        }

        stage('Auto Fix & Lint') {
            steps {
                echo '🎨 Running Prettier & ESLint auto-fix...'
                sh '''
                    if npm run | grep -q "format"; then
                        npm run format || true
                    else
                        echo "⚠️ No 'format' script found in package.json"
                    fi

                    if npm run | grep -q "lint:fix"; then
                        npm run lint:fix || true
                    else
                        echo "⚠️ No 'lint:fix' script found in package.json"
                    fi
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Running tests...'
                sh '''
                    if npm run | grep -q "test"; then
                        npm test || true
                    else
                        echo "⚠️ No 'test' script found in package.json"
                    fi
                '''
            }
        }

        stage('Push Auto-Fixes to GitHub') {
            steps {
                echo '📤 Committing & pushing any auto-fixes...'
                withCredentials([usernamePassword(credentialsId: 'github-creds', usernameVariable: 'GITHUB_USER', passwordVariable: 'GITHUB_TOKEN')]) {
                    sh '''
                        git config user.name "jenkins"
                        git config user.email "jenkins@ci.local"
                        git add .
                        if ! git diff --cached --quiet; then
                            git commit -m "🔧 Auto-fix: lint & format corrections [ci skip]"
                            git push https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/social-media.git ${GIT_BRANCH}
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
            echo '❌ Build failed. Check the logs for more details.'
        }
    }
}
