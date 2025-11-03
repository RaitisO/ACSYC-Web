<script setup lang="ts">
defineOptions({
  name: 'TeacherDashboard',
})
</script>

<template>
  <div class="teacher-dashboard">
    <h1>Teacher Dashboard</h1>
    <div class="teacher-grid">
      <div class="teacher-card">
        <h3>My Students</h3>
        <p>View your assigned students</p>
      </div>
      <div class="teacher-card">
        <h3>Lesson Calendar</h3>
        <p>Schedule and manage lessons</p>
      </div>
      <div class="teacher-card">
        <h3>Teaching Subjects</h3>
        <p>Manage your subjects</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.teacher-dashboard {
  padding: 2rem;
}
.teacher-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.teacher-card {
  background: #38aad9;
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
}
</style>
