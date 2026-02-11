import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  User,
  Plug,
  Mic,
  Brain,
  Database,
  Eye,
  EyeOff,
  RefreshCw,
  MessageCircle,
  CalendarDays,
} from "lucide-react";

const DEEPGRAM_VOICES = [
  { id: "aura-asteria-en", label: "Asteria", description: "Female, warm, conversational" },
  { id: "aura-luna-en", label: "Luna", description: "Female, soft, calm" },
  { id: "aura-stella-en", label: "Stella", description: "Female, clear, professional" },
  { id: "aura-athena-en", label: "Athena", description: "Female, authoritative" },
  { id: "aura-hera-en", label: "Hera", description: "Female, expressive" },
  { id: "aura-orion-en", label: "Orion", description: "Male, deep, confident" },
  { id: "aura-arcas-en", label: "Arcas", description: "Male, warm, friendly" },
  { id: "aura-perseus-en", label: "Perseus", description: "Male, clear, neutral" },
  { id: "aura-angus-en", label: "Angus", description: "Male, casual" },
  { id: "aura-orpheus-en", label: "Orpheus", description: "Male, rich, storytelling" },
];

export function Settings() {
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("aura-asteria-en");
  const [proactiveSuggestions, setProactiveSuggestions] = useState(true);
  const [autoCategorization, setAutoCategorization] = useState("balanced");
  const [defaultSection, setDefaultSection] = useState("active-projects");

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none">
      <div className="max-w-2xl mx-auto p-6 space-y-6 pb-12">
        <h1 className="text-page-title text-white/90">Settings</h1>

        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-white/50" strokeWidth={1.5} />
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                </Avatar>
                <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs text-white/70 font-medium">
                  Change
                </button>
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-white/90 font-medium">Profile Photo</p>
                <p className="text-xs text-white/40">Recommended: Square image, at least 200x200px</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email ?? ""}
                disabled
                className="opacity-60"
              />
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plug className="h-5 w-5 text-white/50" strokeWidth={1.5} />
              <div>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect external services</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg glass-surface">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-white/50" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-white/90">Google Calendar</p>
                  <p className="text-xs text-white/40">Sync events and meetings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">Not Connected</Badge>
                <Button variant="secondary" size="sm">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Connect
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg glass-surface">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-white/50" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-white/90">Telegram</p>
                  <p className="text-xs text-white/40">Receive notifications and quick capture</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">Not Connected</Badge>
                <Button variant="secondary" size="sm">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Connect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mic className="h-5 w-5 text-white/50" strokeWidth={1.5} />
              <div>
                <CardTitle>Voice</CardTitle>
                <CardDescription>Configure Deepgram voice settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Deepgram API Key</Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={apiKeyVisible ? "text" : "password"}
                  placeholder="Enter your Deepgram API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {apiKeyVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEEPGRAM_VOICES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.label} — {voice.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* AI Behavior */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-white/50" strokeWidth={1.5} />
              <div>
                <CardTitle>AI Behavior</CardTitle>
                <CardDescription>Customize how the AI assistant works</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Proactive Suggestions</Label>
                <p className="text-xs text-white/40">AI will offer suggestions without being asked</p>
              </div>
              <Switch
                checked={proactiveSuggestions}
                onCheckedChange={setProactiveSuggestions}
              />
            </div>

            <div className="space-y-2">
              <Label>Auto-Categorization</Label>
              <p className="text-xs text-white/40 mb-1">How aggressively the AI categorizes new content</p>
              <Select value={autoCategorization} onValueChange={setAutoCategorization}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Section for New Notes</Label>
              <Select value={defaultSection} onValueChange={setDefaultSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active-projects">Active Projects</SelectItem>
                  <SelectItem value="ideas">Ideas</SelectItem>
                  <SelectItem value="things-to-try">Things to Try</SelectItem>
                  <SelectItem value="philosophies">Philosophies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-white/50" strokeWidth={1.5} />
              <div>
                <CardTitle>Data</CardTitle>
                <CardDescription>Manage your data and account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full sm:w-auto">
              Export Data
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All your data will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
