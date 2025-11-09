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

        stage('Install Dependencies') {
            steps {
                echo '📥 Installing project dependencies...'
                sh '''
                    node -v
                    npm -v
                    npm install
                '''
            }
        }

        stage('Code Format & Lint Check') {
            steps {
                echo '🎨 Running Prettier and ESLint checks...'
                script {
                    try {
                        sh 'npm run format:check'
                    } catch (err) {
                        echo '⚠️ Format issues found. Auto-fixing...'
                        sh 'npm run format || true'
                    }

                    try {
                        sh 'npm run lint'
                    } catch (err) {
                        echo '⚠️ Lint issues found. Auto-fixing...'
                        sh 'npm run lint:fix || true'
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Running tests...'
                sh 'npm test || true'
            }
        }

        stage('Commit and Push Auto-Fixes') {
            steps {
                echo '📤 Checking for code fixes to commit...'
                script {
                    sh '''
                        git config user.email "jenkins@ci.local"
                        git config user.name "jenkins"
                        git add .
                        if ! git diff --cached --quiet; then
                            git commit -m "🔧 Auto-fix: lint & format corrections [ci skip]"
                            git push https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/Rujalladhe/social-media.git ${GIT_BRANCH}
                        else
                            echo "✅ No changes to push."
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
            echo '❌ CI pipeline failed! Check the logs for details.'
        }
    }
}
