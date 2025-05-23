import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Clock, 
  Sparkles, 
  Settings2, 
  Eye, 
  Keyboard, 
  Save, 
  RotateCcw 
} from 'lucide-react';

export interface StudySettingsData {
  general: {
    cardsPerSession: number;
    newCardsPerDay: number;
    reviewsPerDay: number;
    showProgressBar: boolean;
    preferredStrategy: string;
  };
  appearance: {
    showImages: boolean;
    enableAnimations: boolean;
    darkMode: 'system' | 'light' | 'dark';
    fontSize: number;
  };
  notifications: {
    enableReminders: boolean;
    reminderTime: string;
    reminderDays: string[];
    soundEffects: boolean;
  };
  advanced: {
    spacedRepetitionAlgorithm: 'sm2' | 'fsrs';
    orderNewCards: 'added' | 'random';
    orderReviews: 'due' | 'random';
    enableOfflineMode: boolean;
  };
}

const defaultSettings: StudySettingsData = {
  general: {
    cardsPerSession: 20,
    newCardsPerDay: 10,
    reviewsPerDay: 50,
    showProgressBar: true,
    preferredStrategy: 'spaced-repetition'
  },
  appearance: {
    showImages: true,
    enableAnimations: true,
    darkMode: 'system',
    fontSize: 16
  },
  notifications: {
    enableReminders: false,
    reminderTime: '19:00',
    reminderDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    soundEffects: true
  },
  advanced: {
    spacedRepetitionAlgorithm: 'sm2',
    orderNewCards: 'added',
    orderReviews: 'due',
    enableOfflineMode: true
  }
};

interface StudySettingsProps {
  initialSettings?: StudySettingsData;
  onSave: (settings: StudySettingsData) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

/**
 * Component for configuring study session settings and preferences
 */
export const StudySettings: React.FC<StudySettingsProps> = ({
  initialSettings,
  onSave,
  onCancel,
  isSaving = false
}) => {
  const [settings, setSettings] = useState<StudySettingsData>(
    initialSettings || defaultSettings
  );
  const [activeTab, setActiveTab] = useState('general');
  
  // Handle input changes
  const handleGeneralChange = (field: keyof typeof settings.general, value: any) => {
    setSettings({
      ...settings,
      general: {
        ...settings.general,
        [field]: value
      }
    });
  };
  
  const handleAppearanceChange = (field: keyof typeof settings.appearance, value: any) => {
    setSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        [field]: value
      }
    });
  };
  
  const handleNotificationsChange = (field: keyof typeof settings.notifications, value: any) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: value
      }
    });
  };
  
  const handleAdvancedChange = (field: keyof typeof settings.advanced, value: any) => {
    setSettings({
      ...settings,
      advanced: {
        ...settings.advanced,
        [field]: value
      }
    });
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };
  
  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Ustawienia nauki
          </CardTitle>
          <CardDescription>
            Dostosuj sposób nauki i przypomnienia do własnych preferencji
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid grid-cols-4">
              <TabsTrigger value="general" className="text-xs sm:text-sm">
                Ogólne
              </TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs sm:text-sm">
                Wygląd
              </TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm">
                Powiadomienia
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs sm:text-sm">
                Zaawansowane
              </TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cardsPerSession">Liczba fiszek w sesji</Label>
                    <span className="text-sm">{settings.general.cardsPerSession}</span>
                  </div>
                  <Slider
                    id="cardsPerSession"
                    min={5}
                    max={100}
                    step={5}
                    value={[settings.general.cardsPerSession]}
                    onValueChange={(value) => handleGeneralChange('cardsPerSession', value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newCardsPerDay">Nowe fiszki dziennie</Label>
                    <span className="text-sm">{settings.general.newCardsPerDay}</span>
                  </div>
                  <Slider
                    id="newCardsPerDay"
                    min={0}
                    max={50}
                    step={5}
                    value={[settings.general.newCardsPerDay]}
                    onValueChange={(value) => handleGeneralChange('newCardsPerDay', value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reviewsPerDay">Powtórki dziennie</Label>
                    <span className="text-sm">{settings.general.reviewsPerDay}</span>
                  </div>
                  <Slider
                    id="reviewsPerDay"
                    min={0}
                    max={200}
                    step={10}
                    value={[settings.general.reviewsPerDay]}
                    onValueChange={(value) => handleGeneralChange('reviewsPerDay', value[0])}
                  />
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="showProgressBar">Pasek postępu</Label>
                    <span className="text-xs text-muted-foreground">Pokazuj pasek postępu podczas sesji</span>
                  </div>
                  <Switch
                    id="showProgressBar"
                    checked={settings.general.showProgressBar}
                    onCheckedChange={(value) => handleGeneralChange('showProgressBar', value)}
                  />
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="preferredStrategy">Domyślna strategia nauki</Label>
                  <Select
                    value={settings.general.preferredStrategy}
                    onValueChange={(value) => handleGeneralChange('preferredStrategy', value)}
                  >
                    <SelectTrigger id="preferredStrategy">
                      <SelectValue placeholder="Wybierz strategię" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spaced-repetition">Powtórki rozłożone w czasie</SelectItem>
                      <SelectItem value="new-first">Nowe fiszki</SelectItem>
                      <SelectItem value="due-first">Zaległe powtórki</SelectItem>
                      <SelectItem value="random">Losowa kolejność</SelectItem>
                      <SelectItem value="cram">Tryb intensywny</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="showImages">Obrazki w fiszkach</Label>
                    <span className="text-xs text-muted-foreground">Pokazuj obrazki w fiszkach (jeśli dostępne)</span>
                  </div>
                  <Switch
                    id="showImages"
                    checked={settings.appearance.showImages}
                    onCheckedChange={(value) => handleAppearanceChange('showImages', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="enableAnimations">Animacje</Label>
                    <span className="text-xs text-muted-foreground">Włącz animacje przejść między fiszkami</span>
                  </div>
                  <Switch
                    id="enableAnimations"
                    checked={settings.appearance.enableAnimations}
                    onCheckedChange={(value) => handleAppearanceChange('enableAnimations', value)}
                  />
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="darkMode">Motyw</Label>
                  <Select
                    value={settings.appearance.darkMode}
                    onValueChange={(value: 'system' | 'light' | 'dark') => 
                      handleAppearanceChange('darkMode', value)
                    }
                  >
                    <SelectTrigger id="darkMode">
                      <SelectValue placeholder="Wybierz motyw" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">Systemowy</SelectItem>
                      <SelectItem value="light">Jasny</SelectItem>
                      <SelectItem value="dark">Ciemny</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fontSize">Rozmiar tekstu</Label>
                    <span className="text-sm">{settings.appearance.fontSize}px</span>
                  </div>
                  <Slider
                    id="fontSize"
                    min={12}
                    max={24}
                    step={1}
                    value={[settings.appearance.fontSize]}
                    onValueChange={(value) => handleAppearanceChange('fontSize', value[0])}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="enableReminders">Przypomnienia</Label>
                    <span className="text-xs text-muted-foreground">Włącz przypomnienia o nauce</span>
                  </div>
                  <Switch
                    id="enableReminders"
                    checked={settings.notifications.enableReminders}
                    onCheckedChange={(value) => handleNotificationsChange('enableReminders', value)}
                  />
                </div>
                
                {settings.notifications.enableReminders && (
                  <>
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="reminderTime">Godzina przypomnienia</Label>
                      <Input
                        id="reminderTime"
                        type="time"
                        value={settings.notifications.reminderTime}
                        onChange={(e) => handleNotificationsChange('reminderTime', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <Label>Dni przypomnienia</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                          const isSelected = settings.notifications.reminderDays.includes(day);
                          return (
                            <Button
                              key={day}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const newDays = isSelected
                                  ? settings.notifications.reminderDays.filter(d => d !== day)
                                  : [...settings.notifications.reminderDays, day];
                                handleNotificationsChange('reminderDays', newDays);
                              }}
                            >
                              {day}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="soundEffects">Efekty dźwiękowe</Label>
                    <span className="text-xs text-muted-foreground">Odtwarzaj dźwięki podczas nauki</span>
                  </div>
                  <Switch
                    id="soundEffects"
                    checked={settings.notifications.soundEffects}
                    onCheckedChange={(value) => handleNotificationsChange('soundEffects', value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="algorithm">Algorytm powtórek</Label>
                  <Select
                    value={settings.advanced.spacedRepetitionAlgorithm}
                    onValueChange={(value: 'sm2' | 'fsrs') => 
                      handleAdvancedChange('spacedRepetitionAlgorithm', value)
                    }
                  >
                    <SelectTrigger id="algorithm">
                      <SelectValue placeholder="Wybierz algorytm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm2">SM-2 (SuperMemo)</SelectItem>
                      <SelectItem value="fsrs">FSRS 4.0 (Zaawansowany)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    SM-2 to klasyczny algorytm powtórek, FSRS to nowsza, bardziej zaawansowana implementacja
                  </p>
                </div>
                
                <Separator className="my-2" />
                
                <div className="space-y-2">
                  <Label htmlFor="orderNewCards">Kolejność nowych fiszek</Label>
                  <Select
                    value={settings.advanced.orderNewCards}
                    onValueChange={(value: 'added' | 'random') => 
                      handleAdvancedChange('orderNewCards', value)
                    }
                  >
                    <SelectTrigger id="orderNewCards">
                      <SelectValue placeholder="Wybierz porządek" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="added">Wg daty dodania</SelectItem>
                      <SelectItem value="random">Losowo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="orderReviews">Kolejność powtórek</Label>
                  <Select
                    value={settings.advanced.orderReviews}
                    onValueChange={(value: 'due' | 'random') => 
                      handleAdvancedChange('orderReviews', value)
                    }
                  >
                    <SelectTrigger id="orderReviews">
                      <SelectValue placeholder="Wybierz porządek" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due">Wg terminu (najstarsze pierwsze)</SelectItem>
                      <SelectItem value="random">Losowo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="enableOfflineMode">Tryb offline</Label>
                    <span className="text-xs text-muted-foreground">Pozwól na naukę bez dostępu do internetu</span>
                  </div>
                  <Switch
                    id="enableOfflineMode"
                    checked={settings.advanced.enableOfflineMode}
                    onCheckedChange={(value) => handleAdvancedChange('enableOfflineMode', value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetToDefaults}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetuj
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onCancel}
            >
              Anuluj
            </Button>
          </div>
          
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-t-transparent" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Zapisz
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}; 