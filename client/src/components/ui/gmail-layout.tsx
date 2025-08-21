import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  Menu, 
  Search, 
  Settings, 
  HelpCircle,
  Grid3X3,
  Bell,
  Edit,
  Inbox,
  Star,
  Clock,
  Send,
  FileText,
  Trash2,
  Archive,
  Tag,
  Users,
  Brain,
  BarChart3
} from "lucide-react";

interface GmailLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  sidebarContent?: ReactNode;
  userDiscStyle?: 'D' | 'I' | 'S' | 'C';
}

const DISC_COLORS = {
  D: 'hsl(0, 84.2%, 60.2%)',
  I: 'hsl(45, 93%, 47%)',
  S: 'hsl(142, 71%, 45%)',
  C: 'hsl(207, 90%, 54%)',
};

const DISC_NAMES = {
  D: 'Dominance',
  I: 'Influence',
  S: 'Steadiness',
  C: 'Conscientiousness',
};

export default function GmailLayout({ 
  children, 
  showSidebar = true, 
  sidebarContent,
  userDiscStyle 
}: GmailLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Gmail Header */}
      <header className="bg-white border-b border-google-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5 text-google-gray-600" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-google-blue rounded-sm flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="text-google-gray-900 text-xl font-normal">Gmail</span>
              </div>
            </div>
            
            {/* Extension Badge */}
            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
              DISC Extension Active
            </Badge>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-google-gray-500" />
              <input
                type="text"
                placeholder="Search mail"
                className="w-full bg-google-gray-100 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-google-blue focus:bg-white border border-transparent focus:border-google-blue"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {userDiscStyle && (
              <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                  style={{ backgroundColor: DISC_COLORS[userDiscStyle] }}
                >
                  {userDiscStyle}
                </div>
                <span className="text-sm text-blue-800">Your DISC: {DISC_NAMES[userDiscStyle]}</span>
              </div>
            )}
            
            <Button variant="ghost" size="sm">
              <HelpCircle className="w-5 h-5 text-google-gray-600" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-5 h-5 text-google-gray-600" />
            </Button>
            <Button variant="ghost" size="sm">
              <Grid3X3 className="w-5 h-5 text-google-gray-600" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="w-5 h-5 text-google-gray-600" />
            </Button>
            
            {/* User Avatar */}
            <div className="w-8 h-8 bg-google-blue rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Gmail Sidebar */}
        {showSidebar && (
          <aside className="w-64 bg-white border-r border-google-gray-200 p-4 min-h-screen">
            {/* Compose Button */}
            <Button className="w-full bg-google-gray-50 hover:shadow-google text-google-gray-700 border border-google-gray-300 mb-6 justify-start">
              <Edit className="w-4 h-4 mr-3" />
              Compose
            </Button>
            
            {/* Navigation */}
            <nav className="space-y-2 mb-8">
              <a href="#" className="flex items-center px-4 py-2 text-google-gray-900 bg-red-100 rounded-r-full font-medium">
                <Inbox className="w-4 h-4 mr-3" />
                Inbox
                <span className="ml-auto text-sm">1,175</span>
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full">
                <Star className="w-4 h-4 mr-3" />
                Starred
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full">
                <Clock className="w-4 h-4 mr-3" />
                Snoozed
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full">
                <Send className="w-4 h-4 mr-3" />
                Sent
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full">
                <FileText className="w-4 h-4 mr-3" />
                Drafts
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full">
                <Archive className="w-4 h-4 mr-3" />
                Archive
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full">
                <Trash2 className="w-4 h-4 mr-3" />
                Trash
              </a>
            </nav>

            {/* Extension: Sender Categories Section */}
            <div className="border-t border-google-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-google-gray-900">My Sender Categories</h3>
                <Button variant="ghost" size="sm">
                  <Settings className="w-3 h-3 text-google-blue" />
                </Button>
              </div>
              <nav className="space-y-1">
                <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3" />
                  Parents
                  <span className="ml-auto text-xs">23</span>
                </a>
                <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  Students
                  <span className="ml-auto text-xs">67</span>
                </a>
                <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                  Staff
                  <span className="ml-auto text-xs">12</span>
                </a>
                <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3" />
                  Administration
                  <span className="ml-auto text-xs">8</span>
                </a>
                <a href="#" className="flex items-center px-4 py-2 text-google-gray-600 hover:bg-google-gray-50 rounded-r-full text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  Extracurriculars
                  <span className="ml-auto text-xs">15</span>
                </a>
              </nav>
            </div>

            {/* Custom Sidebar Content */}
            {sidebarContent && (
              <div className="border-t border-google-gray-200 pt-4 mt-4">
                {sidebarContent}
              </div>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
