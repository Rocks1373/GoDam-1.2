"""
GoDam 1.0 - Main Entry Point
Complete Logistics Management System
"""
import streamlit as st
from pathlib import Path
import sys

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from config.settings import APP_NAME, APP_VERSION, APP_DESCRIPTION
from config.theme import get_theme_css, COLORS, get_theme_colors
from core.api import api_client, auth_api

# Get colors for current theme
colors = COLORS['dark']  # Default to dark theme

# Page configuration
st.set_page_config(
    page_title=f"{APP_NAME} - Login",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Initialize session state
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'user' not in st.session_state:
    st.session_state.user = None
if 'role' not in st.session_state:
    st.session_state.role = None
if 'theme' not in st.session_state:
    st.session_state.theme = 'dark'
if 'token' not in st.session_state:
    st.session_state.token = None

# Apply theme
st.markdown(get_theme_css(st.session_state.theme), unsafe_allow_html=True)


def login_page():
    """Display login page"""
    
    # Center the login form
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        st.markdown("<br><br>", unsafe_allow_html=True)
        
        # Logo and title
        st.markdown(f"""
        <div style='text-align: center; margin-bottom: 2rem;'>
            <h1 class='gradient-text' style='font-size: 3rem; margin-bottom: 0.5rem;'>📦 {APP_NAME}</h1>
            <p style='color: {colors['text_secondary']}; font-size: 1.2rem;'>{APP_DESCRIPTION}</p>
            <p style='color: {colors['text_tertiary']}; font-size: 0.9rem;'>Version {APP_VERSION}</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Login form in a glass card
        st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
        
        st.markdown("<h2 style='text-align: center; margin-bottom: 1.5rem;'>Sign In</h2>", unsafe_allow_html=True)
        
        # Check backend health
        with st.spinner("Checking backend connection..."):
            backend_healthy = api_client.health_check()
        
        if not backend_healthy:
            st.error("⚠️ Cannot connect to backend server. Please ensure the backend is running at " + api_client.base_url)
            st.info("💡 Start the backend with: `cd backend && npm run start:dev`")
            return
        
        st.success("✅ Backend connected")
        
        # Login form
        with st.form("login_form"):
            username = st.text_input("Username", placeholder="Enter your username")
            password = st.text_input("Password", type="password", placeholder="Enter your password")
            remember_me = st.checkbox("Remember me")
            
            col_a, col_b, col_c = st.columns([1, 2, 1])
            with col_b:
                submit = st.form_submit_button("🚀 Sign In", use_container_width=True)
            
            if submit:
                if not username or not password:
                    st.error("Please enter both username and password")
                else:
                    try:
                        with st.spinner("Authenticating..."):
                            response = auth_api.login(username, password)
                        
                        # Store session data (handle both camelCase and snake_case)
                        user_data = response.get('user', {})
                        st.session_state.authenticated = True
                        st.session_state.user = user_data.get('username', username)
                        st.session_state.role = user_data.get('role', 'VIEWER')
                        st.session_state.token = response.get('accessToken') or response.get('access_token')
                        st.session_state.user_id = user_data.get('id') or user_data.get('userId')
                        st.session_state.permissions = user_data.get('permissions', [])
                        
                        st.success(f"Welcome back, {st.session_state.user}!")
                        st.rerun()
                        
                    except Exception as e:
                        st.error(f"Login failed: {str(e)}")
        
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Footer
        st.markdown(f"""
        <div style='text-align: center; margin-top: 3rem; color: {colors['text_tertiary']};'>
            <p>© 2025 GoDam Logistics. All rights reserved.</p>
            <p style='font-size: 0.8rem;'>Need help? Contact your system administrator</p>
        </div>
        """, unsafe_allow_html=True)


def main_app():
    """Display main application"""
    
    # Sidebar
    with st.sidebar:
        st.markdown(f"""
        <div style='text-align: center; padding: 1rem;'>
            <h2 class='gradient-text'>📦 {APP_NAME}</h2>
            <p style='color: {colors['text_secondary']};'>v{APP_VERSION}</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        # User info
        st.markdown(f"""
        <div class='glass-card' style='padding: 1rem;'>
            <p style='margin: 0; color: {colors['text_secondary']}; font-size: 0.8rem;'>Logged in as</p>
            <p style='margin: 0; font-weight: 600; font-size: 1.1rem;'>{st.session_state.user}</p>
            <p style='margin: 0; color: {colors['primary']}; font-size: 0.9rem;'>{st.session_state.role}</p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        # Theme toggle
        theme_label = "🌙 Dark Mode" if st.session_state.theme == "dark" else "☀️ Light Mode"
        if st.button(theme_label, use_container_width=True):
            st.session_state.theme = "light" if st.session_state.theme == "dark" else "dark"
            st.rerun()
        
        st.markdown("---")
        
        # Logout button
        if st.button("🚪 Logout", use_container_width=True):
            auth_api.logout()
            st.session_state.authenticated = False
            st.session_state.user = None
            st.session_state.role = None
            st.session_state.token = None
            st.rerun()
    
    # Main content
    st.markdown(f"""
    <div style='text-align: center; padding: 2rem;'>
        <h1 class='gradient-text'>Welcome to {APP_NAME}</h1>
        <p style='color: {colors['text_secondary']}; font-size: 1.2rem; margin-top: 1rem;'>
            Complete Logistics Management System
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # Feature cards
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown(f"""
        <div class='glass-card' style='text-align: center; padding: 2rem;'>
            <div style='font-size: 3rem; margin-bottom: 1rem;'>📦</div>
            <h3>Orders Management</h3>
            <p style='color: {colors['text_secondary']};'>
                Manage orders, create DNs, track deliveries
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class='glass-card' style='text-align: center; padding: 2rem;'>
            <div style='font-size: 3rem; margin-bottom: 1rem;'>🏭</div>
            <h3>Stock Management</h3>
            <p style='color: {colors['text_secondary']};'>
                Track inventory, manage locations, view movements
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class='glass-card' style='text-align: center; padding: 2rem;'>
            <div style='font-size: 3rem; margin-bottom: 1rem;'>🔄</div>
            <h3>DN Matching</h3>
            <p style='color: {colors['text_secondary']};'>
                Match delivery notes with purchase orders
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown(f"""
        <div class='glass-card' style='text-align: center; padding: 2rem;'>
            <div style='font-size: 3rem; margin-bottom: 1rem;'>📈</div>
            <h3>Reports & Analytics</h3>
            <p style='color: {colors['text_secondary']};'>
                View insights, generate reports, track KPIs
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class='glass-card' style='text-align: center; padding: 2rem;'>
            <div style='font-size: 3rem; margin-bottom: 1rem;'>🤖</div>
            <h3>AI Terminal</h3>
            <p style='color: {colors['text_secondary']};'>
                Natural language queries, smart assistance
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class='glass-card' style='text-align: center; padding: 2rem;'>
            <div style='font-size: 3rem; margin-bottom: 1rem;'>⚙️</div>
            <h3>Settings</h3>
            <p style='color: {colors['text_secondary']};'>
                Configure system, manage users, preferences
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    # Quick stats
    st.markdown("<br><br>", unsafe_allow_html=True)
    st.markdown("<h2 style='text-align: center;'>Quick Stats</h2>", unsafe_allow_html=True)
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class='metric-card'>
            <div class='metric-value'>--</div>
            <div class='metric-label'>Total Orders</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class='metric-card'>
            <div class='metric-value'>--</div>
            <div class='metric-label'>Stock Items</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class='metric-card'>
            <div class='metric-value'>--</div>
            <div class='metric-label'>Pending DNs</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class='metric-card'>
            <div class='metric-value'>--</div>
            <div class='metric-label'>Active Users</div>
        </div>
        """, unsafe_allow_html=True)
    
    # Navigation hint
    st.markdown("<br><br>", unsafe_allow_html=True)
    st.info("👈 Use the sidebar to navigate between different sections of the application")


# Main logic
if not st.session_state.authenticated:
    login_page()
else:
    main_app()
