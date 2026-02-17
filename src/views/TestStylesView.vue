<template>
  <div class="test-styles-container">
    <div class="test-header">
      <h1>🎨 Component Styles Test</h1>
      <p>Visual verification of extracted CSS styles</p>
    </div>

    <div class="test-content">
      <!-- ProfileSection Test -->
      <section class="test-section">
        <h2>ProfileSection Styles</h2>
        <div class="component-wrapper">
          <div class="profile-section">
            <div class="profile-header">
              <div class="avatar-large">JD</div>
              <div class="profile-title">
                <h1>John Doe</h1>
                <div class="role-badge">Teacher</div>
              </div>
              <div class="profile-actions">
                <button class="btn-primary">Edit Profile</button>
                <button class="btn-secondary">Settings</button>
              </div>
            </div>

            <div class="profile-info">
              <h2>Profile Information</h2>
              <div class="info-grid">
                <div class="info-group">
                  <label>Email</label>
                  <div class="info-value">john.doe@example.com</div>
                </div>
                <div class="info-group">
                  <label>Role</label>
                  <div class="info-value"><span class="role-tag">Teacher</span></div>
                </div>
                <div class="info-group">
                  <label>Join Date</label>
                  <div class="info-value">February 17, 2026</div>
                </div>
                <div class="info-group">
                  <label>Status</label>
                  <div class="info-value">Active</div>
                </div>
              </div>
            </div>

            <div class="password-section">
              <h2>Change Password</h2>
              <div class="password-form">
                <div class="info-group">
                  <label>Current Password</label>
                  <input type="password" class="form-input" placeholder="Enter current password" />
                </div>
                <div class="info-group">
                  <label>New Password</label>
                  <input type="password" class="form-input" placeholder="Enter new password" />
                </div>
                <div class="info-group">
                  <label>Confirm Password</label>
                  <input type="password" class="form-input" placeholder="Confirm new password" />
                </div>
                <div class="password-actions">
                  <button class="btn-primary">Update Password</button>
                  <button class="btn-cancel">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ConnectionsSection Test -->
      <section class="test-section">
        <h2>ConnectionsSection Styles</h2>
        <div class="component-wrapper">
          <div class="connections-section">
            <div class="code-section">
              <h2>🔗 Your Connection Code</h2>
              <div class="code-display">
                <div class="code-value">ABC123</div>
                <div class="code-actions">
                  <button class="btn-secondary">Copy</button>
                  <button class="btn-secondary">Regenerate</button>
                </div>
              </div>
              <p class="code-expiry">Expires: February 24, 2026</p>
            </div>

            <div class="connect-section">
              <h2>🤝 Connect with Another User</h2>
              <div class="connect-form">
                <input type="text" class="code-input" placeholder="000000" maxlength="6" />
                <button class="btn-primary">Connect</button>
              </div>
            </div>

            <div class="connections-list">
              <h2>📋 Your Connections</h2>
              <div class="connections-grid">
                <div class="connection-card">
                  <div class="connection-info">
                    <h3>Jane Smith</h3>
                    <p class="connection-type">Student</p>
                    <p class="connection-date">Connected: 2/10/2026</p>
                  </div>
                </div>
                <div class="connection-card">
                  <div class="connection-info">
                    <h3>Mike Johnson</h3>
                    <p class="connection-type">Parent</p>
                    <p class="connection-date">Connected: 2/5/2026</p>
                  </div>
                </div>
                <div class="connection-card">
                  <div class="connection-info">
                    <h3>Sarah Williams</h3>
                    <p class="connection-type">Teacher</p>
                    <p class="connection-date">Connected: 1/30/2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- DashboardView Styles -->
      <section class="test-section">
        <h2>DashboardView Styles</h2>
        <div class="component-wrapper">
          <div class="dashboard-nav">
            <div class="nav-content">
              <h2>Dashboard</h2>
              <div class="nav-actions">
                <span class="user-role">teacher</span>
                <button class="logout-btn">Logout</button>
              </div>
            </div>
          </div>
          <div class="dashboard-main">
            <div class="container">
              <div class="user-info">
                <p><strong>Welcome, John!</strong></p>
                <p>Role: Teacher</p>
                <p>Email: john.doe@example.com</p>
              </div>
              <div class="dashboard-content">
                <p>Dashboard content would appear here...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- AdminDashboard Styles -->
      <section class="test-section">
        <h2>AdminDashboard Styles</h2>
        <div class="component-wrapper">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
            <!-- Teacher Card -->
            <div style="background: linear-gradient(135deg, #6c0f5f 0%, #8b1a7f 100%); border-radius: 12px; padding: 1.5rem; color: white; cursor: pointer; transition: all 0.3s ease;">
              <div style="font-weight: bold; margin-bottom: 0.5rem;">John Smith</div>
              <div style="opacity: 0.9; font-size: 0.9rem;">john.smith@school.edu</div>
              <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button style="background: white; color: #6c0f5f; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500;">Manage</button>
              </div>
            </div>

            <!-- Admin Card -->
            <div style="background: linear-gradient(135deg, #6c0f5f 0%, #8b1a7f 100%); border-radius: 12px; padding: 1.5rem; color: white; cursor: pointer; transition: all 0.3s ease;">
              <div style="font-weight: bold; margin-bottom: 0.5rem;">Admin User</div>
              <div style="opacity: 0.9; font-size: 0.9rem;">admin@school.edu</div>
              <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button style="background: white; color: #6c0f5f; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 500;">Manage</button>
              </div>
            </div>
          </div>

          <!-- Modal Example -->
          <div style="margin-top: 2rem; padding: 1.5rem; background: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
            <h3>Modal Components</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
              <button style="background: #6c0f5f; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Create Lesson</button>
              <button style="background: #38aad9; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Add Connection</button>
              <button style="background: #42993c; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Save Changes</button>
              <button style="background: transparent; color: #6c0f5f; padding: 0.75rem 1.5rem; border: 2px solid #6c0f5f; border-radius: 6px; cursor: pointer; font-weight: 500;">Cancel</button>
            </div>
          </div>
        </div>
      </section>

      <!-- TeacherDashboard Styles -->
      <section class="test-section">
        <h2>TeacherDashboard Styles</h2>
        <div class="component-wrapper">
          <!-- Section View -->
          <div style="background: #fff9d8; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
            <h3 style="margin-top: 0; color: #6c0f5f;">My Students</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
              <div style="background: white; padding: 1rem; border-radius: 8px; text-align: center; border: 2px solid #38aad9;">
                <div style="font-weight: bold; margin-bottom: 0.25rem;">Jane Doe</div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.75rem;">Grade 10</div>
                <button style="background: #38aad9; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; width: 100%; font-weight: 500;">View</button>
              </div>
              <div style="background: white; padding: 1rem; border-radius: 8px; text-align: center; border: 2px solid #38aad9;">
                <div style="font-weight: bold; margin-bottom: 0.25rem;">Mike Johnson</div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.75rem;">Grade 10</div>
                <button style="background: #38aad9; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; width: 100%; font-weight: 500;">View</button>
              </div>
              <div style="background: white; padding: 1rem; border-radius: 8px; text-align: center; border: 2px solid #38aad9;">
                <div style="font-weight: bold; margin-bottom: 0.25rem;">Sarah Williams</div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.75rem;">Grade 10</div>
                <button style="background: #38aad9; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; width: 100%; font-weight: 500;">View</button>
              </div>
            </div>
          </div>

          <!-- Teacher Buttons -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <button style="background: #38aad9; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Schedule Lesson</button>
            <button style="background: #42993c; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Send Message</button>
            <button style="background: #bf1ba9; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">View Calendar</button>
            <button style="background: transparent; color: #38aad9; padding: 0.75rem 1.5rem; border: 2px solid #38aad9; border-radius: 6px; cursor: pointer; font-weight: 500;">Settings</button>
          </div>
        </div>
      </section>

      <!-- StudentDashboard Styles -->
      <section class="test-section">
        <h2>StudentDashboard Styles</h2>
        <div class="component-wrapper">
          <!-- Student Grid Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <button style="background: #ff9a1f; border: 2px solid #ff9a1f; border-radius: 10px; padding: 1.5rem; cursor: pointer; text-align: left; transition: all 0.3s ease;">
              <h3 style="margin: 0 0 0.5rem 0; color: #fff9d8;">My Teachers</h3>
              <p style="margin: 0; color: #fff9d8; font-size: 0.9rem;">See all your teachers</p>
            </button>
            <button style="background: #ff9a1f; border: 2px solid #ff9a1f; border-radius: 10px; padding: 1.5rem; cursor: pointer; text-align: left; transition: all 0.3s ease;">
              <h3 style="margin: 0 0 0.5rem 0; color: #fff9d8;">Progress</h3>
              <p style="margin: 0; color: #fff9d8; font-size: 0.9rem;">Track your learning progress</p>
            </button>
            <button style="background: #ff9a1f; border: 2px solid #ff9a1f; border-radius: 10px; padding: 1.5rem; cursor: pointer; text-align: left; transition: all 0.3s ease;">
              <h3 style="margin: 0 0 0.5rem 0; color: #fff9d8;">Connections</h3>
              <p style="margin: 0; color: #fff9d8; font-size: 0.9rem;">Connect with teachers and parents</p>
            </button>
          </div>

          <!-- Upcoming Lessons Section -->
          <div style="background: #fff9d8; border: 1px solid #e8d89f; border-radius: 10px; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; gap: 1rem;">
              <h3 style="margin: 0; font-size: 1.1rem; color: #2b2b2b;">Next 5 Upcoming Lessons</h3>
              <div style="display: flex; gap: 0.5rem;">
                <a href="#" style="padding: 0.5rem 1rem; background: #ffd500; color: #000; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; text-decoration: none; cursor: pointer;">Miro Board</a>
                <a href="#" style="padding: 0.5rem 1rem; background: #2d8cff; color: #fff; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; text-decoration: none; cursor: pointer;">Zoom</a>
              </div>
            </div>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="display: flex; flex-direction: column; gap: 0.25rem; padding: 0.6rem; border-radius: 8px; background: #fffdf0; border: 1px solid #f0e0a0; margin-bottom: 0.5rem;">
                <div style="font-size: 0.95rem; color: #333;">Feb 18, 2026 <span style="margin: 0 0.4rem; color: #999;">•</span> 2:00 PM</div>
                <div style="font-size: 0.9rem; color: #444; display: flex; gap: 1rem;">
                  <span>Teacher: <strong>John Smith</strong></span>
                  <span>Subject: <strong>Math</strong></span>
                </div>
              </li>
              <li style="display: flex; flex-direction: column; gap: 0.25rem; padding: 0.6rem; border-radius: 8px; background: #fffdf0; border: 1px solid #f0e0a0; margin-bottom: 0.5rem;">
                <div style="font-size: 0.95rem; color: #333;">Feb 19, 2026 <span style="margin: 0 0.4rem; color: #999;">•</span> 3:30 PM</div>
                <div style="font-size: 0.9rem; color: #444; display: flex; gap: 1rem;">
                  <span>Teacher: <strong>Sarah Williams</strong></span>
                  <span>Subject: <strong>English</strong></span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ParentDashboard Styles -->
      <section class="test-section">
        <h2>ParentDashboard Styles</h2>
        <div class="component-wrapper">
          <!-- Parent Grid Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <button style="background: #9bbf19; color: white; padding: 1.5rem; border-radius: 10px; border: none; cursor: pointer; text-align: left; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
              <h3 style="margin: 0 0 1rem 0; font-size: 1.3rem;">My Children</h3>
              <p style="margin: 0; opacity: 0.9;">View your children's profiles</p>
            </button>
            <button style="background: #9bbf19; color: white; padding: 1.5rem; border-radius: 10px; border: none; cursor: pointer; text-align: left; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
              <h3 style="margin: 0 0 1rem 0; font-size: 1.3rem;">Lesson Schedule</h3>
              <p style="margin: 0; opacity: 0.9;">See your children's lessons</p>
            </button>
            <button style="background: #9bbf19; color: white; padding: 1.5rem; border-radius: 10px; border: none; cursor: pointer; text-align: left; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
              <h3 style="margin: 0 0 1rem 0; font-size: 1.3rem;">Progress Reports</h3>
              <p style="margin: 0; opacity: 0.9;">Monitor learning progress</p>
            </button>
          </div>

          <!-- Children and Teachers List -->
          <div style="background: #fff9d8; border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem;">
            <h3 style="margin-top: 0; color: #6c0f5f; margin-bottom: 1rem;">My Children (2)</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
              <div style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 1rem; border-left: 4px solid #9bbf19;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: #9bbf19; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">JD</div>
                <div>
                  <h4 style="margin: 0 0 0.5rem 0; color: #6c0f5f;">Jane Doe</h4>
                  <p style="margin: 0 0 0.5rem 0; color: #6c757d; font-size: 0.9rem;">jane.doe@email.com</p>
                  <p style="margin: 0; color: #6c757d; font-size: 0.8rem;">Connected: 2/1/2026</p>
                </div>
              </div>
              <div style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 1rem; border-left: 4px solid #9bbf19;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: #9bbf19; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">MS</div>
                <div>
                  <h4 style="margin: 0 0 0.5rem 0; color: #6c0f5f;">Mike Smith</h4>
                  <p style="margin: 0 0 0.5rem 0; color: #6c757d; font-size: 0.9rem;">mike.smith@email.com</p>
                  <p style="margin: 0; color: #6c757d; font-size: 0.8rem;">Connected: 2/5/2026</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Teachers List -->
          <div style="background: #fff9d8; border-radius: 10px; padding: 1.5rem;">
            <h3 style="margin-top: 0; color: #6c0f5f; margin-bottom: 1rem;">Connected Teachers (2)</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
              <div style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 1rem; border-left: 4px solid #38aad9;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: #38aad9; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">JS</div>
                <div>
                  <h4 style="margin: 0 0 0.5rem 0; color: #6c0f5f;">John Smith</h4>
                  <p style="margin: 0 0 0.5rem 0; color: #6c757d; font-size: 0.9rem;">john.smith@school.edu</p>
                  <p style="margin: 0; color: #6c757d; font-size: 0.8rem;">Connected: 2/3/2026</p>
                </div>
              </div>
              <div style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); display: flex; align-items: center; gap: 1rem; border-left: 4px solid #38aad9;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: #38aad9; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">SW</div>
                <div>
                  <h4 style="margin: 0 0 0.5rem 0; color: #6c0f5f;">Sarah Williams</h4>
                  <p style="margin: 0 0 0.5rem 0; color: #6c757d; font-size: 0.9rem;">sarah.williams@school.edu</p>
                  <p style="margin: 0; color: #6c757d; font-size: 0.8rem;">Connected: 2/10/2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- RegisterTeacherView Styles -->
      <section class="test-section">
        <h2>RegisterTeacherView Styles</h2>
        <div class="component-wrapper" style="background: linear-gradient(135deg, #ff9a1f 0%, #bf1ba9 100%); border-radius: 15px; padding: 2rem; min-height: 400px; display: flex; align-items: center; justify-content: center;">
          <div style="background: #fff9d8; padding: 2rem; border-radius: 12px; width: 100%; max-width: 450px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);">
            <h3 style="color: #6c0f5f; text-align: center; margin-top: 0; margin-bottom: 1.5rem; font-size: 1.5rem;">Teacher Registration</h3>

            <!-- Registration Form Example -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
              <div>
                <label style="display: block; color: #6c0f5f; margin-bottom: 0.5rem; font-weight: bold;">First Name</label>
                <input style="width: 100%; padding: 0.75rem; border: 2px solid #f2d422; border-radius: 8px; box-sizing: border-box;" type="text" placeholder="First name" />
              </div>
              <div>
                <label style="display: block; color: #6c0f5f; margin-bottom: 0.5rem; font-weight: bold;">Last Name</label>
                <input style="width: 100%; padding: 0.75rem; border: 2px solid #f2d422; border-radius: 8px; box-sizing: border-box;" type="text" placeholder="Last name" />
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; color: #6c0f5f; margin-bottom: 0.5rem; font-weight: bold;">Email Address</label>
              <input style="width: 100%; padding: 0.75rem; border: 2px solid #f2d422; border-radius: 8px; box-sizing: border-box;" type="email" placeholder="Email address" />
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; color: #6c0f5f; margin-bottom: 0.5rem; font-weight: bold;">Password</label>
              <input style="width: 100%; padding: 0.75rem; border: 2px solid #f2d422; border-radius: 8px; box-sizing: border-box;" type="password" placeholder="Password" />
              <small style="display: block; color: #42993c; font-size: 0.8rem; margin-top: 0.25rem;">8+ chars, uppercase, lowercase, number, special</small>
            </div>

            <button style="width: 100%; background: #9bbf19; color: white; padding: 0.75rem; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 1rem;">Create Account</button>

            <p style="text-align: center; color: #333;">Already have an account? <a style="color: #38aad9; text-decoration: none; font-weight: bold; cursor: pointer;">Sign in</a></p>
          </div>
        </div>
      </section>

      <!-- RegistrationPendingView Styles -->
      <section class="test-section">
        <h2>RegistrationPendingView Styles</h2>
        <div class="component-wrapper" style="background: linear-gradient(135deg, #42993c 0%, #38aad9 100%); border-radius: 15px; padding: 2rem; min-height: 500px; display: flex; align-items: center; justify-content: center;">
          <div style="background: #fff9d8; padding: 2rem; border-radius: 12px; width: 100%; max-width: 550px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); text-align: center;">
            <div style="font-size: 3rem; color: #42993c; margin-bottom: 1rem;">✓</div>
            <h3 style="color: #6c0f5f; margin: 0 0 0.5rem 0; font-size: 1.5rem;">Application Submitted Successfully!</h3>
            <p style="color: #42993c; font-size: 1rem; margin-bottom: 1.5rem; font-weight: 500;">Thank you for registering with ACSYC</p>

            <!-- Info Boxes -->
            <div style="text-align: left; margin-bottom: 1.5rem;">
              <div style="background: rgba(255, 255, 255, 0.7); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #38aad9;">
                <h4 style="color: #6c0f5f; margin: 0 0 0.75rem 0; font-size: 0.95rem;">What Happens Next?</h4>
                <ol style="color: #333; margin: 0; padding-left: 1.25rem; font-size: 0.9rem; line-height: 1.6;">
                  <li>Your application has been received and is pending review</li>
                  <li>An admin will review your registration</li>
                  <li>You'll receive an email notification once approved</li>
                </ol>
              </div>

              <div style="background: rgba(255, 255, 255, 0.7); padding: 1rem; border-radius: 8px; border-left: 4px solid #42993c;">
                <h4 style="color: #6c0f5f; margin: 0 0 0.75rem 0; font-size: 0.95rem;">Need Help?</h4>
                <p style="color: #333; margin: 0; font-size: 0.9rem; line-height: 1.6;">If you have questions, contact <strong>support@acsyc.com</strong></p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
              <button style="background: #38aad9; color: white; padding: 1rem; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Back to Home</button>
              <button style="background: #42993c; color: white; padding: 1rem; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Go to Login</button>
            </div>

            <p style="color: #666; font-size: 0.85rem; padding-top: 1rem; border-top: 1px solid #f0f0f0; margin: 0;">Check your email for updates on your application status.</p>
          </div>
        </div>
      </section>

      <!-- AdminApplicationsView Styles -->
      <section class="test-section">
        <h2>AdminApplicationsView Styles</h2>
        <div class="component-wrapper" style="background: linear-gradient(135deg, #ff9a1f 0%, #bf1ba9 100%); border-radius: 15px; padding: 2rem; min-height: auto;">
          <div style="max-width: 1200px; margin: 0 auto;">
            <!-- Header -->
            <div style="color: white; margin-bottom: 1.5rem;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1.8rem;">Pending Student Applications</h3>
              <p style="margin: 0; font-size: 0.95rem; opacity: 0.9;">Review and approve family registrations</p>
            </div>

            <!-- Application Card -->
            <div style="background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); overflow: hidden;">
              <!-- Header -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%); border-bottom: 2px solid #f0f0f0;">
                <div>
                  <h4 style="color: #6c0f5f; margin: 0 0 0.5rem 0; font-size: 1.2rem;">Jane Smith Family</h4>
                  <p style="color: #666; font-size: 0.85rem; margin: 0.25rem 0;">Submitted: February 17, 2026 at 2:30 PM</p>
                  <p style="color: #42993c; font-size: 0.9rem; margin: 0.5rem 0 0 0; font-weight: 500;">2 family members registered</p>
                </div>
                <button style="background: #38aad9; color: white; border: none; padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 0.5rem;">▼ Details</button>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; gap: 1rem; padding: 1.5rem; background: #f9f9f9; border-top: 1px solid #eee; justify-content: flex-end;">
                <button style="background: #42993c; color: white; padding: 0.6rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 0.5rem;">✓ Approve</button>
                <button style="background: #ff6b6b; color: white; padding: 0.6rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 0.5rem;">✕ Reject</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- TeacherRegisteredView Styles -->
      <section class="test-section">
        <h2>TeacherRegisteredView Styles</h2>
        <div class="component-wrapper" style="background: linear-gradient(135deg, #42993c 0%, #38aad9 100%); border-radius: 15px; padding: 2rem; min-height: 400px; display: flex; align-items: center; justify-content: center;">
          <div style="background: #fff9d8; padding: 2rem; border-radius: 12px; width: 100%; max-width: 550px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); text-align: center;">
            <div style="font-size: 2.5rem; color: #42993c; margin-bottom: 1rem;">✓</div>
            <h3 style="color: #6c0f5f; margin: 0 0 0.5rem 0; font-size: 1.3rem;">Welcome to the Team!</h3>
            <p style="color: #42993c; font-size: 0.95rem; margin-bottom: 1.5rem; font-weight: 500;">Your teacher account has been created successfully</p>

            <!-- Info Boxes -->
            <div style="text-align: left; margin-bottom: 1.5rem;">
              <div style="background: rgba(255, 255, 255, 0.7); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #38aad9;">
                <p style="color: #333; margin: 0; font-size: 0.9rem;"><strong>Email:</strong> teacher@school.edu</p>
              </div>

              <div style="background: rgba(255, 255, 255, 0.7); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #38aad9;">
                <h4 style="color: #6c0f5f; margin: 0 0 0.75rem 0; font-size: 0.95rem;">You're All Set!</h4>
                <p style="color: #333; margin: 0; font-size: 0.9rem; line-height: 1.6;">Your account is active and ready to use. You can now log in and start managing lessons.</p>
              </div>

              <div style="background: rgba(255, 255, 255, 0.7); padding: 1rem; border-radius: 8px; border-left: 4px solid #42993c;">
                <h4 style="color: #6c0f5f; margin: 0 0 0.75rem 0; font-size: 0.95rem;">Next Steps</h4>
                <ol style="color: #333; margin: 0; padding-left: 1.25rem; font-size: 0.9rem; line-height: 1.6;">
                  <li>Log in with your new account</li>
                  <li>Complete your profile information</li>
                  <li>Set up your teaching preferences</li>
                </ol>
              </div>
            </div>

            <!-- Action Button -->
            <button style="background: #42993c; color: white; padding: 0.75rem 2rem; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Go to Login</button>

            <p style="color: #666; font-size: 0.8rem; padding-top: 1rem; border-top: 1px solid #f0f0f0; margin: 1rem 0 0 0;">Have questions? Contact our support team for help.</p>
          </div>
        </div>
      </section>

      <!-- DashboardView Styles -->
      <section class="test-section">
        <h2>DashboardView Styles</h2>
        <div class="component-wrapper">
          <div style="background: #fff9d8; border-bottom: 2px solid #f2d422; padding: 1rem 0;">
            <div style="max-width: 1200px; margin: 0 auto; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center;">
              <h2 style="color: #6c0f5f; margin: 0;">Welcome, John Doe</h2>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: #42993c; font-weight: bold; text-transform: capitalize;">(Teacher)</span>
                <button style="background: #bf1ba9; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 25px; cursor: pointer; font-weight: bold;">Log Out</button>
              </div>
            </div>
          </div>
          <div style="padding: 2rem; min-height: 400px; background: linear-gradient(135deg, #38aad9 0%, #42993c 100%); display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 600px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);">
              <h3 style="color: #6c0f5f; margin-top: 0;">Dashboard Content</h3>
              <p style="color: #666;">Role-based dashboard displayed here (AdminDashboard, TeacherDashboard, StudentDashboard, or ParentDashboard depending on user role)</p>
              <div style="background: #fff9d8; padding: 1rem; border-radius: 8px; margin-top: 1rem; border-left: 4px solid #38aad9;">
                <p style="color: #333; margin: 0; font-size: 0.9rem;"><strong>Loading State:</strong> Displays spinner and "Verifying session..." while validating backend session</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- TomSelect Styles -->
      <section class="test-section">
        <h2>TomSelect Styles (Form Input)</h2>
        <div class="component-wrapper" style="padding: 2rem; background: white;">
          <label style="display: block; margin-bottom: 1rem; color: #333; font-weight: 500;">Select an option:</label>
          <select class="ts-control" style="width: 100%; border: 2px solid #f2d422; border-radius: 8px; padding: 0.5rem; background: white; min-height: 40px;">
            <option value="">Select...</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
          <p style="color: #666; font-size: 0.9rem; margin-top: 1rem;">Custom Tom Select styling with yellow border and blue focus state</p>
        </div>
      </section>

      <!-- Color Palette Reference -->
      <section class="test-section">
        <h2>Color Palette Reference</h2>
        <div class="color-palette">
          <div class="color-item">
            <div class="color-box" style="background: #6c0f5f;"></div>
            <p>#6c0f5f - Primary Purple</p>
          </div>
          <div class="color-item">
            <div class="color-box" style="background: #38aad9;"></div>
            <p>#38aad9 - Sky Blue</p>
          </div>
          <div class="color-item">
            <div class="color-box" style="background: #42993c;"></div>
            <p>#42993c - Forest Green</p>
          </div>
          <div class="color-item">
            <div class="color-box" style="background: #bf1ba9;"></div>
            <p>#bf1ba9 - Magenta</p>
          </div>
          <div class="color-item">
            <div class="color-box" style="background: #fff9d8;"></div>
            <p>#fff9d8 - Light Yellow</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import '../components/sections/ProfileSection.css'
import '../components/sections/ConnectionsSection.css'
import './DashboardView.css'
import '../styles/views/dashboards.css'
import '../styles/views/auth.css'
import '../styles/views/admin.css'
import '../styles/components/navigation.css'
import '../styles/components/form-inputs.css'
import '../styles/views/layout.css'
</script>

<style scoped>
.test-styles-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
}

.test-header {
  background: linear-gradient(135deg, #6c0f5f, #38aad9);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
}

.test-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
}

.test-header p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.test-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.test-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-section h2 {
  color: #6c0f5f;
  margin-top: 0;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.component-wrapper {
  margin-top: 2rem;
  padding: 1rem;
  background: #fafafa;
  border-radius: 8px;
  overflow-x: auto;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.color-item {
  text-align: center;
}

.color-box {
  width: 100%;
  height: 100px;
  border-radius: 8px;
  border: 1px solid #ddd;
  margin-bottom: 0.5rem;
}

.color-item p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

@media (max-width: 768px) {
  .test-header {
    padding: 2rem 1rem;
  }

  .test-header h1 {
    font-size: 1.8rem;
  }

  .test-content {
    padding: 1rem;
  }

  .test-section {
    padding: 1rem;
  }

  .component-wrapper {
    min-height: auto;
  }
}
</style>
