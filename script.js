class TaskTracker {
    constructor() {
        this.taskCount = 0;
        this.timer = null;
        this.startTime = null;
        this.tasks = [];
        this.targetAHTValue = 0;
        this.handleTimes = [];
        this.isTimerRunning = false;
        this.elapsedTime = 0;
        this.lastStartTime = null;
        this.totalTasksTarget = 0;

        // DOM Elements
        this.elements = {
            submitButton: document.getElementById('submitTask'),
            undoButton: document.getElementById('undoButton'),
            exportButton: document.getElementById('exportData'),
            taskCounter: document.getElementById('taskCounter'),
            timerDisplay: document.getElementById('timer'),
            totalTasks: document.getElementById('totalTasks'),
            targetAHT: document.getElementById('targetAHT'),
            setTargetAHTButton: document.getElementById('setTargetAHT'),
            targetAHTDisplay: document.getElementById('targetAHTDisplay'),
            handleTimeDisplay: document.getElementById('handleTimeDisplay'),
            setTotalTasks: document.getElementById('setTotalTasks'),
            totalTasksDisplay: document.getElementById('totalTasksDisplay'),
            timerControl: document.getElementById('timerControl'),
            recommendedTimeDisplay: document.getElementById('recommendedTimeDisplay'),
            resetButton: document.getElementById('resetAll'),
            lastTaskTime: document.getElementById('lastTaskTime'),
        };

        this.initializeEventListeners();
        this.initializeKeyboardShortcuts();
        this.loadFromLocalStorage();
    }

    initializeEventListeners() {
        this.elements.submitButton.addEventListener('click', () => this.submitTaskWithAnimation());
        this.elements.undoButton.addEventListener('click', () => this.undoLastTask());
        this.elements.exportButton.addEventListener('click', () => this.exportData());
        this.elements.setTargetAHTButton.addEventListener('click', () => this.setTargetAHT());
        this.elements.setTotalTasks.addEventListener('click', () => this.setTotalTasks());
        this.elements.timerControl.addEventListener('click', () => this.toggleTimer());
        this.elements.resetButton.addEventListener('click', () => this.confirmReset());
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && event.altKey && !event.ctrlKey) {
                event.preventDefault();
                if (!this.elements.submitButton.disabled) {
                    this.submitTaskWithAnimation();
                }
            }
        });
    }

    setTargetAHT() {
        const targetValue = parseInt(this.elements.targetAHT.value);
        if (targetValue && targetValue > 0) {
            this.targetAHTValue = targetValue;
            this.elements.targetAHTDisplay.textContent = `${targetValue}s`;
            this.updateRecommendedTime();
            this.saveToLocalStorage();
        } else {
            this.elements.targetAHTDisplay.textContent = 'Invalid';
            setTimeout(() => {
                this.elements.targetAHTDisplay.textContent = this.targetAHTValue ? `${this.targetAHTValue}s` : '';
            }, 2000);
        }
    }

    setTotalTasks() {
        const totalValue = parseInt(this.elements.totalTasks.value);
        if (totalValue && totalValue > 0) {
            this.totalTasksTarget = totalValue;
            this.elements.totalTasksDisplay.textContent = `${totalValue}`;
            this.elements.taskCounter.textContent = `${this.taskCount}/${this.totalTasksTarget}`;
            this.updateRecommendedTime();
            this.saveToLocalStorage();
        } else {
            this.elements.totalTasksDisplay.textContent = 'Invalid';
            setTimeout(() => {
                this.elements.totalTasksDisplay.textContent = this.totalTasksTarget ? `${this.totalTasksTarget}` : '';
            }, 2000);
        }
    }

    submitTask() {
        this.taskCount++;
        this.elements.taskCounter.textContent = `${this.taskCount}/${this.totalTasksTarget}`;

        const currentElapsed = this.isTimerRunning ? (Date.now() - this.lastStartTime) / 1000 : 0;
        const totalElapsed = this.elapsedTime + currentElapsed;

        if (totalElapsed > 0) {
            this.handleTimes.push(totalElapsed);
            this.updateAverageHandleTime();
        }

        this.tasks.push({
            timestamp: new Date(),
            taskNumber: this.taskCount,
            handleTime: totalElapsed,
        });

        this.elements.lastTaskTime.textContent = `${totalElapsed.toFixed(1)}s`;

        if (this.isTimerRunning) {
            this.elapsedTime = 0;
            this.lastStartTime = Date.now();
        }

        this.updateRecommendedTime();
        this.saveToLocalStorage();
    }

    submitTaskWithAnimation() {
        this.elements.submitButton.classList.add('clicked');
        this.submitTask();
        setTimeout(() => {
            this.elements.submitButton.classList.remove('clicked');
        }, 500);
    }

    toggleTimer() {
        if (this.isTimerRunning) {
            this.pauseTimer();
            this.elements.timerControl.textContent = 'Start Timer';
            this.elements.timerControl.classList.remove('active');
            this.elements.submitButton.disabled = true;
        } else {
            this.startTimer();
            this.elements.timerControl.textContent = 'Pause Timer';
            this.elements.timerControl.classList.add('active');
            this.elements.submitButton.disabled = false;
        }
        this.isTimerRunning = !this.isTimerRunning;
        this.saveToLocalStorage();
    }

    startTimer() {
        this.lastStartTime = Date.now();
        this.timer = setInterval(() => {
            const currentElapsed = (Date.now() - this.lastStartTime) / 1000;
            const totalElapsed = this.elapsedTime + currentElapsed;
            const minutes = Math.floor(totalElapsed / 60);
            const seconds = Math.floor(totalElapsed % 60);
            this.elements.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    pauseTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            const currentElapsed = (Date.now() - this.lastStartTime) / 1000;
            this.elapsedTime += currentElapsed;
        }
    }

    resetTimer() {
        this.pauseTimer();
        this.elements.timerDisplay.textContent = '00:00';
        this.isTimerRunning = false;
        this.elements.timerControl.textContent = 'Start Timer';
        this.elements.submitButton.disabled = true;
        this.elapsedTime = 0;
        this.lastStartTime = null;
    }

    undoLastTask() {
        if (this.taskCount > 0) {
            this.taskCount--;
            this.elements.taskCounter.textContent = `${this.taskCount}/${this.totalTasksTarget}`;
            this.tasks.pop();
            this.handleTimes.pop();
            this.updateAverageHandleTime();
            this.updateRecommendedTime();
            this.saveToLocalStorage();
        }
    }

    exportData() {
        const csvContent = this.tasks.map(task => `${task.taskNumber},${task.timestamp}`).join('\n');
        const blob = new Blob(['Task Number,Timestamp\n' + csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'task_data.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    updateAverageHandleTime() {
        if (this.handleTimes.length === 0) {
            this.elements.handleTimeDisplay.textContent = '0s';
            return;
        }

        const sum = this.handleTimes.reduce((a, b) => a + b, 0);
        const average = (sum / this.handleTimes.length).toFixed(1);
        this.elements.handleTimeDisplay.textContent = `${average}s`;
        this.updateRecommendedTime();
    }

    updateRecommendedTime() {
        if (!this.targetAHTValue || !this.totalTasksTarget) {
            this.elements.recommendedTimeDisplay.textContent = '0s';
            return;
        }

        const targetTotalTime = this.targetAHTValue * this.totalTasksTarget;
        const timeSpent = this.handleTimes.reduce((a, b) => a + b, 0);
        const remainingTasks = this.totalTasksTarget - this.taskCount;

        if (remainingTasks <= 0) {
            this.elements.recommendedTimeDisplay.textContent = `${this.targetAHTValue}s`;
            return;
        }

        const remainingTime = targetTotalTime - timeSpent;
        const recommendedTime = (remainingTime / remainingTasks).toFixed(1);
        this.elements.recommendedTimeDisplay.textContent = `${Math.max(0, recommendedTime)}s`;
    }

    confirmReset() {
        const confirmed = confirm("Are you sure you want to reset everything? All your data will be permanently deleted.");
        if (confirmed) {
            this.resetEverything();
        }
    }

    resetEverything() {
        this.taskCount = 0;
        this.tasks = [];
        this.handleTimes = [];
        this.targetAHTValue = 0;
        this.totalTasksTarget = 0;

        this.elements.taskCounter.textContent = '0/0';
        this.elements.targetAHTDisplay.textContent = '';
        this.elements.totalTasksDisplay.textContent = '';
        this.elements.handleTimeDisplay.textContent = '0s';
        this.elements.recommendedTimeDisplay.textContent = '0s';
        this.elements.lastTaskTime.textContent = '0s';

        this.elements.totalTasks.value = '';
        this.elements.targetAHT.value = '';

        this.resetTimer();
        localStorage.removeItem('taskTrackerData');
    }

    saveToLocalStorage() {
        const data = {
            taskCount: this.taskCount,
            tasks: this.tasks,
            handleTimes: this.handleTimes,
            targetAHTValue: this.targetAHTValue,
            totalTasksTarget: this.totalTasksTarget,
            elapsedTime: this.elapsedTime,
            isTimerRunning: this.isTimerRunning,
            lastStartTime: this.lastStartTime,
        };
        localStorage.setItem('taskTrackerData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = JSON.parse(localStorage.getItem('taskTrackerData'));
        if (data) {
            this.taskCount = data.taskCount;
            this.tasks = data.tasks;
            this.handleTimes = data.handleTimes;
            this.targetAHTValue = data.targetAHTValue;
            this.totalTasksTarget = data.totalTasksTarget;
            this.elapsedTime = data.elapsedTime;
            this.isTimerRunning = data.isTimerRunning;
            this.lastStartTime = data.lastStartTime;

            this.elements.taskCounter.textContent = `${this.taskCount}/${this.totalTasksTarget}`;
            this.elements.targetAHTDisplay.textContent = this.targetAHTValue ? `${this.targetAHTValue}s` : '';
            this.elements.totalTasksDisplay.textContent = this.totalTasksTarget ? `${this.totalTasksTarget}` : '';
            this.updateAverageHandleTime();
            this.updateRecommendedTime();

            if (this.isTimerRunning) {
                this.startTimer();
            }
        }
    }
}

// Initialize the tracker when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const tracker = new TaskTracker();
});