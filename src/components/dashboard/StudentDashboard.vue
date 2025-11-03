<script setup lang="ts">
defineOptions({
  name: 'StudentDashboard',
})
</script>

<template>
  <div class="student-dashboard">
    <h1>Student Portal</h1>
    <div class="student-grid">
      <div class="student-card">
        <h3>My Lessons</h3>
        <p>View your upcoming lessons</p>
      </div>
      <div class="student-card">
        <h3>My Teachers</h3>
        <p>See all your teachers</p>
      </div>
      <div class="student-card">
        <h3>Progress</h3>
        <p>Track your learning progress</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.student-dashboard {
  padding: 2rem;
}
.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.student-card {
  background: #ff9a1f;
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
}
</style>
