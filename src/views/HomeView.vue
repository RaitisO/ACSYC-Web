<script setup lang="ts">
// Home page specific logic can go here
</script>

<template>
  <main>
    <!-- Hero Section -->
    <section id="home" class="section hero-section">
      <div class="container">
        <h1>Welcome to ACSYC Tutoring</h1>
        <p>Professional tutoring services to help you succeed</p>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="section">
      <div class="container">
        <h2>About Us</h2>
        <p>Learn more about ACSYC and our mission</p>
      </div>
    </section>

    <!-- Lessons Section -->
    <section id="lessons" class="section">
      <div class="container">
        <h2>Our Lessons</h2>
        <p>Comprehensive tutoring services in various subjects</p>
      </div>
    </section>

    <!-- Blog Section -->
    <section id="blog" class="section">
      <div class="container">
        <h2>Blog</h2>
        <p>Latest articles and educational insights</p>
      </div>
    </section>

    <!-- Events Section -->
    <section id="events" class="section">
      <div class="container">
        <h2>Events</h2>
        <p>Upcoming workshops and learning events</p>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="section">
      <div class="container">
        <h2>Contact Us</h2>
        <p>Get in touch to start your learning journey</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.section {
  min-height: 100vh;
  padding: 6rem 2rem 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.cta-button {
  background: #ff9a1f;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
}

.cta-button:hover {
  background: #f2d422;
  transform: translateY(-2px);
}

/* Section Background Colors */
.hero-section {
  background: linear-gradient(135deg, #38aad9 0%, #42993c 100%);
  color: white;
}

#about {
  background: #9bbf19;
  color: white;
}

#lessons {
  background: #f2d422;
  color: #6c0f5f;
}

#blog {
  background: #bf1ba9;
  color: white;
}

#events {
  background: #6c0f5f;
  color: white;
}

#contact {
  background: #42993c;
  color: white;
}

h1,
h2 {
  margin-bottom: 1rem;
}

h1 {
  font-size: 3rem;
}

h2 {
  font-size: 2.5rem;
}

p {
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
}
</style>
