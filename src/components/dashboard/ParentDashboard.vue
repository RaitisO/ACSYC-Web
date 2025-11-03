<script setup lang="ts">
defineOptions({
  name: 'ParentDashboard',
})
</script>

<template>
  <div class="parent-dashboard">
    <h1>Parent Dashboard</h1>
    <div class="parent-grid">
      <div class="parent-card">
        <h3>My Children</h3>
        <p>View your children's profiles</p>
      </div>
      <div class="parent-card">
        <h3>Lesson Schedule</h3>
        <p>See your children's lessons</p>
      </div>
      <div class="parent-card">
        <h3>Progress Reports</h3>
        <p>Monitor learning progress</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.parent-dashboard {
  padding: 2rem;
}
.parent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.parent-card {
  background: #9bbf19;
  color: white;
  padding: 1.5rem;
  border-radius: 10px;
}
</style>
