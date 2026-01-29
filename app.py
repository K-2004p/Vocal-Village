from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime
import os
import json
import uuid
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'vocal-village-secret-key')
CORS(app, supports_credentials=True, origins=["http://localhost:5500", "http://127.0.0.1:5500"])

# In-memory storage (replace with database in production)
reports_db = []
users_db = {}

class Report:
    def __init__(self, report_id, user_id, problem_type, description, 
                 voice_text, location, language, status="pending"):
        self.report_id = report_id
        self.user_id = user_id
        self.problem_type = problem_type
        self.description = description
        self.voice_text = voice_text
        self.location = location
        self.language = language
        self.status = status
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()
    
    def to_dict(self):
        return {
            "report_id": self.report_id,
            "user_id": self.user_id,
            "problem_type": self.problem_type,
            "description": self.description,
            "voice_text": self.voice_text,
            "location": self.location,
            "language": self.language,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

# ✅ HOME ROUTE (OUTSIDE CLASS)
@app.route('/')
def home():
    return jsonify({
        "message": "Vocal Village Backend is Running",
        "available_endpoints": [
            "/api/health",
            "/api/login/manual",
            "/api/login/digilocker",
            "/api/report/submit",
            "/api/report/user",
            "/api/admin/login",
            "/api/admin/reports",
            "/api/admin/stats"
        ]
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/login/digilocker', methods=['POST'])
def digilocker_login():
    try:
        data = request.get_json()
        aadhaar_number = data.get('aadhaar_number')
        
        if not aadhaar_number or len(aadhaar_number) != 12:
            return jsonify({"error": "Invalid Aadhaar number"}), 400
        
        user_id = f"user_{aadhaar_number[-4:]}"
        session['user_id'] = user_id
        session['aadhaar_number'] = aadhaar_number
        session['login_method'] = 'digilocker'
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "message": "Login successful"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login/manual', methods=['POST'])
def manual_login():
    try:
        data = request.get_json()
        aadhaar_number = data.get('aadhaar_number')
        name = data.get('name', '')
        phone = data.get('phone', '')
        
        if not aadhaar_number or len(aadhaar_number) != 12:
            return jsonify({"error": "Invalid Aadhaar number"}), 400
        
        user_id = f"user_{aadhaar_number[-4:]}"
        users_db[user_id] = {
            "aadhaar_number": aadhaar_number,
            "name": name,
            "phone": phone,
            "created_at": datetime.now().isoformat()
        }
        
        session['user_id'] = user_id
        session['aadhaar_number'] = aadhaar_number
        session['login_method'] = 'manual'
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "message": "Login successful"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/report/submit', methods=['POST'])
def submit_report():
    try:
        if 'user_id' not in session:
            return jsonify({"error": "User not logged in"}), 401
        
        data = request.get_json()
        
        required_fields = ['problem_type', 'description', 'location', 'language']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        report_id = str(uuid.uuid4())[:8]
        report = Report(
            report_id=report_id,
            user_id=session['user_id'],
            problem_type=data['problem_type'],
            description=data.get('description', ''),
            voice_text=data.get('voice_text', ''),
            location=data['location'],
            language=data['language'],
            status="submitted"
        )
        
        reports_db.append(report.to_dict())
        
        return jsonify({
            "success": True,
            "report_id": report_id,
            "reference_number": f"VV-{report_id.upper()}",
            "message": "Report submitted successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/report/user', methods=['GET'])
def get_user_reports():
    try:
        if 'user_id' not in session:
            return jsonify({"error": "User not logged in"}), 401
        
        user_id = session['user_id']
        user_reports = [r for r in reports_db if r['user_id'] == user_id]
        
        return jsonify({
            "success": True,
            "reports": user_reports,
            "count": len(user_reports)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/report/<report_id>', methods=['GET'])
def get_report(report_id):
    try:
        report = next((r for r in reports_db if r['report_id'] == report_id), None)
        
        if not report:
            return jsonify({"error": "Report not found"}), 404
        
        return jsonify({
            "success": True,
            "report": report
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/translate/<language>', methods=['GET'])
def get_translations(language):
    try:
        file_path = f"../translations/{language}.json"
        
        if not os.path.exists(file_path):
            return jsonify({"error": "Language not supported"}), 404
        
        with open(file_path, 'r', encoding='utf-8') as f:
            translations = json.load(f)
        
        return jsonify({
            "success": True,
            "language": language,
            "translations": translations
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/location/geocode', methods=['POST'])
def geocode_location():
    try:
        data = request.get_json()
        lat = data.get('latitude')
        lng = data.get('longitude')
        
        if not lat or not lng:
            return jsonify({"error": "Missing coordinates"}), 400
        
        location_data = {
            "address": f"Near Village Panchayat, Coordinates: {lat}, {lng}",
            "village": "Sample Village",
            "district": "Sample District",
            "state": "Sample State",
            "coordinates": {"lat": lat, "lng": lng}
        }
        
        return jsonify({
            "success": True,
            "location": location_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/speech/process', methods=['POST'])
def process_speech():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        return jsonify({
            "success": True,
            "text": text,
            "language": "en-IN",
            "confidence": 0.85
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ====================== ADMIN ROUTES ======================

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({"error": "Admin authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

# Admin login
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # Validate admin credentials
        valid_admins = {
            'admin': 'admin123',
            'villageadmin': 'village@2024'
        }
        
        if username in valid_admins and valid_admins[username] == password:
            session['admin_logged_in'] = True
            session['admin_username'] = username
            return jsonify({
                "success": True,
                "message": "Login successful",
                "username": username
            })
        
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Admin logout
@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)
    return jsonify({"success": True, "message": "Logged out successfully"})

# Get all reports (admin view)
@app.route('/api/admin/reports', methods=['GET'])
@admin_required
def get_all_reports():
    try:
        # Get query parameters
        status = request.args.get('status', 'all')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        
        # Filter reports based on parameters
        filtered_reports = reports_db.copy()
        
        if status != 'all':
            filtered_reports = [r for r in filtered_reports if r['status'] == status]
        
        # Pagination
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_reports = filtered_reports[start_index:end_index]
        
        # Get counts by status
        status_counts = {
            'total': len(reports_db),
            'submitted': len([r for r in reports_db if r['status'] == 'submitted']),
            'pending': len([r for r in reports_db if r['status'] == 'pending']),
            'in_progress': len([r for r in reports_db if r['status'] == 'in_progress']),
            'resolved': len([r for r in reports_db if r['status'] == 'resolved']),
            'rejected': len([r for r in reports_db if r['status'] == 'rejected'])
        }
        
        return jsonify({
            "success": True,
            "reports": paginated_reports,
            "count": len(filtered_reports),
            "status_counts": status_counts,
            "page": page,
            "limit": limit,
            "total_pages": (len(filtered_reports) + limit - 1) // limit
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get admin dashboard statistics
@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    try:
        # Calculate statistics
        total_reports = len(reports_db)
        total_users = len(users_db)
        
        # Status counts
        status_counts = {
            'submitted': len([r for r in reports_db if r['status'] == 'submitted']),
            'pending': len([r for r in reports_db if r['status'] == 'pending']),
            'in_progress': len([r for r in reports_db if r['status'] == 'in_progress']),
            'resolved': len([r for r in reports_db if r['status'] == 'resolved']),
            'rejected': len([r for r in reports_db if r['status'] == 'rejected'])
        }
        
        # Category counts
        categories = {}
        for report in reports_db:
            category = report['problem_type']
            categories[category] = categories.get(category, 0) + 1
        
        # Language distribution
        languages = {}
        for report in reports_db:
            lang = report['language']
            languages[lang] = languages.get(lang, 0) + 1
        
        # Recent activity (last 7 days)
        recent_reports = []
        week_ago = datetime.now().timestamp() - (7 * 24 * 60 * 60)
        for report in reports_db:
            try:
                report_date = datetime.fromisoformat(report['created_at'].replace('Z', '+00:00'))
                if report_date.timestamp() > week_ago:
                    recent_reports.append(report)
            except:
                continue
        
        return jsonify({
            "success": True,
            "stats": {
                "total_reports": total_reports,
                "total_users": total_users,
                "recent_reports": len(recent_reports),
                "status_counts": status_counts,
                "categories": categories,
                "languages": languages,
                "avg_resolution_time": "3.2 days",  # In production, calculate this
                "villages_covered": 12,  # In production, extract from location data
                "today_submissions": len([r for r in recent_reports if r['created_at'].startswith(datetime.now().date().isoformat())])
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get single report details (admin view)
@app.route('/api/admin/report/<report_id>', methods=['GET'])
@admin_required
def get_admin_report(report_id):
    try:
        report = next((r for r in reports_db if r['report_id'] == report_id), None)
        
        if not report:
            return jsonify({"error": "Report not found"}), 404
        
        # Get user info if available
        user_info = users_db.get(report['user_id'], {})
        
        return jsonify({
            "success": True,
            "report": report,
            "user_info": user_info
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update report status (admin action)
@app.route('/api/admin/report/<report_id>/status', methods=['PUT'])
@admin_required
def update_report_status(report_id):
    try:
        data = request.get_json()
        new_status = data.get('status')
        admin_notes = data.get('notes', '')
        
        if not new_status:
            return jsonify({"error": "Status is required"}), 400
        
        # Find and update report
        for i, report in enumerate(reports_db):
            if report['report_id'] == report_id:
                reports_db[i]['status'] = new_status
                reports_db[i]['updated_at'] = datetime.now().isoformat()
                reports_db[i]['admin_notes'] = admin_notes
                reports_db[i]['resolved_by'] = session.get('admin_username')
                reports_db[i]['resolved_at'] = datetime.now().isoformat()
                
                return jsonify({
                    "success": True,
                    "message": f"Report status updated to {new_status}",
                    "report": reports_db[i]
                })
        
        return jsonify({"error": "Report not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get all users (admin view)
@app.route('/api/admin/users', methods=['GET'])
@admin_required
def get_all_users():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        
        # Convert users_db to list for pagination
        users_list = []
        for user_id, user_data in users_db.items():
            user_entry = {"user_id": user_id, **user_data}
            
            # Add report count for this user
            user_reports = [r for r in reports_db if r['user_id'] == user_id]
            user_entry['report_count'] = len(user_reports)
            
            users_list.append(user_entry)
        
        # Pagination
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_users = users_list[start_index:end_index]
        
        return jsonify({
            "success": True,
            "users": paginated_users,
            "count": len(users_list),
            "page": page,
            "limit": limit,
            "total_pages": (len(users_list) + limit - 1) // limit
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get reports by category
@app.route('/api/admin/reports/category/<category>', methods=['GET'])
@admin_required
def get_reports_by_category(category):
    try:
        filtered_reports = [r for r in reports_db if r['problem_type'] == category]
        
        return jsonify({
            "success": True,
            "category": category,
            "reports": filtered_reports,
            "count": len(filtered_reports)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Delete report (admin only)
@app.route('/api/admin/report/<report_id>', methods=['DELETE'])
@admin_required
def delete_report(report_id):
    try:
        global reports_db
        initial_length = len(reports_db)
        reports_db = [r for r in reports_db if r['report_id'] != report_id]
        
        if len(reports_db) < initial_length:
            return jsonify({
                "success": True,
                "message": f"Report {report_id} deleted successfully"
            })
        else:
            return jsonify({"error": "Report not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Export reports (admin only)
@app.route('/api/admin/reports/export', methods=['GET'])
@admin_required
def export_reports():
    try:
        format_type = request.args.get('format', 'json')
        
        if format_type == 'csv':
            # Simple CSV export
            csv_data = "report_id,user_id,problem_type,status,created_at,location\n"
            for report in reports_db:
                csv_data += f"{report['report_id']},{report['user_id']},{report['problem_type']},{report['status']},{report['created_at']},{report['location']}\n"
            
            return csv_data, 200, {'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=reports.csv'}
        
        else:  # JSON export (default)
            return jsonify({
                "success": True,
                "count": len(reports_db),
                "reports": reports_db,
                "exported_at": datetime.now().isoformat()
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Admin activity log (simplified)
@app.route('/api/admin/activity', methods=['GET'])
@admin_required
def get_admin_activity():
    try:
        # In production, store admin activities in a separate database
        sample_activities = [
            {
                "admin": session.get('admin_username'),
                "action": "logged_in",
                "timestamp": datetime.now().isoformat(),
                "details": "Admin logged into dashboard"
            },
            {
                "admin": session.get('admin_username'),
                "action": "viewed_reports",
                "timestamp": datetime.now().isoformat(),
                "details": "Viewed all reports"
            }
        ]
        
        return jsonify({
            "success": True,
            "activities": sample_activities
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Check admin authentication status
@app.route('/api/admin/check-auth', methods=['GET'])
def check_admin_auth():
    if session.get('admin_logged_in'):
        return jsonify({
            "success": True,
            "authenticated": True,
            "username": session.get('admin_username')
        })
    else:
        return jsonify({
            "success": True,
            "authenticated": False
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)