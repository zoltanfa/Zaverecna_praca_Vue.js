<script setup>
</script>


<template>
  <footer class="footer">
    <div class="footer-container">
      <p>&copy; 2026 PC Shop. All rights reserved.</p>
    </div>
  </footer>
</template>


<style scoped>
.footer {
  background-color: #1f2937;
  color: white;
  padding: 16px 12px;
  margin-top: 40px;
  width: 100%;
  box-sizing: border-box;
}

.footer-container {
  margin: 0 auto;
  text-align: center;
  font-size: 14px;
}

@media (max-width: 480px) {
  .footer {
    padding: 12px 8px;
    margin-top: 20px;
  }

  .footer-container {
    font-size: 12px;
  }
}
</style>