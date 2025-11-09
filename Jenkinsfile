pipeline {
    agent any

    tools {
        nodejs "node18"
    }

    environment {
        GIT_BRANCH = 'main'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo '📦 Checking out source code...'
                git branch: "${GIT_BRANCH}", url: 'https://github.com/yourusername/your-repo.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📥 Installing npm packages...'
                sh 'npm ci'
            }
        }

        stage('Prettier Check') {
            steps {
                echo '🎨 Checking code format...'
                script {
                    try {
                        sh 'npm run format:check'
                    } catch (err) {
                        echo '⚠️ Format issues found! Running auto-fix...'
                        sh 'npm run format'
                    }
                }
            }
        }

        stage('Lint Check') {
            steps {
                echo '🔍 Running ESLint...'
                script {
                    try {
                        sh 'npm run lint'
                    } catch (err) {
                        echo '⚠️ Lint errors found! Running auto-fix...'
                        sh 'npm run lint:fix'
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo '🧪 Running backend unit tests...'
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                echo '🏗️ Building project...'
                sh 'npm run build'
            }
        }

        stage('Commit Auto-Fixes') {
            when {
                expression { fileExists('package.json') }
            }
            steps {
                echo '📤 Committing auto-fix changes (if any)...'
                script {
                    sh '''
                        git config user.email "jenkins@ci.local"
                        git config user.name "jenkins"
                        git add .
                        git diff --cached --quiet || git commit -m "🔧 Auto-fix: lint and format"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ CI pipeline completed successfully with auto-fixes if needed!'
        }
        failure {
            echo '❌ CI pipeline failed! Check logs for details.'
        }
    }
}
