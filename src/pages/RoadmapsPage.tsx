import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRoadmaps, deleteRoadmap, RoadmapDocument, createTestRoadmap } from '@/services/roadmapService';
import { Loader2, Search, Trash2, Plus, AlertTriangle, Bug } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const RoadmapsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState<RoadmapDocument[]>([]);
  const [filteredRoadmaps, setFilteredRoadmaps] = useState<RoadmapDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState<RoadmapDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoadmaps = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        console.log("Loading roadmaps for user:", currentUser.uid);
        const userRoadmaps = await getUserRoadmaps(currentUser.uid);
        console.log("Loaded roadmaps:", userRoadmaps);
        setRoadmaps(userRoadmaps);
        setFilteredRoadmaps(userRoadmaps);
      } catch (error) {
        console.error("Failed to load roadmaps:", error);
        setError("There was an error loading your roadmaps. Please try again later.");
        toast({
          title: "Failed to load roadmaps",
          description: "There was an error loading your roadmaps. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoadmaps();
  }, [currentUser]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRoadmaps(roadmaps);
    } else {
      const filtered = roadmaps.filter(roadmap => 
        roadmap.topic.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRoadmaps(filtered);
    }
  }, [searchQuery, roadmaps]);

  const handleOpenRoadmap = (roadmapId: string) => {
    console.log("Opening roadmap:", roadmapId);
    
    // Try a direct navigation first
    navigate(`/roadmap/${roadmapId}`);
    
    // If we're still having issues, we could try a direct window location change
    // which will force a full page reload
    // Uncomment this if the navigate() approach isn't working
    // window.location.href = `/roadmap/${roadmapId}`;
  };

  const handleDeleteClick = (roadmap: RoadmapDocument) => {
    setRoadmapToDelete(roadmap);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!roadmapToDelete) return;
    
    try {
      await deleteRoadmap(roadmapToDelete.id);
      setRoadmaps(roadmaps.filter(r => r.id !== roadmapToDelete.id));
      toast({
        title: "Roadmap deleted",
        description: "Your roadmap has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the roadmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setRoadmapToDelete(null);
    }
  };

  const retryLoading = () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    getUserRoadmaps(currentUser.uid)
      .then(userRoadmaps => {
        setRoadmaps(userRoadmaps);
        setFilteredRoadmaps(userRoadmaps);
      })
      .catch(error => {
        console.error("Failed to load roadmaps on retry:", error);
        setError("There was an error loading your roadmaps. Please try again later.");
        toast({
          title: "Failed to load roadmaps",
          description: "There was an error loading your roadmaps. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'Unknown date';
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  const handleCreateTestRoadmap = async () => {
    if (!currentUser) return;
    
    try {
      const roadmapId = await createTestRoadmap(currentUser.uid);
      if (roadmapId) {
        toast({
          title: "Test roadmap created",
          description: "A test roadmap has been created for debugging",
        });
        retryLoading();
      }
    } catch (error) {
      console.error("Error creating test roadmap:", error);
      toast({
        title: "Failed to create test roadmap",
        description: "There was an error creating the test roadmap",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4 pt-20">
      <div className="container mx-auto">
        <main className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-lwai-deepBlue">My Learning Roadmaps</h1>
            <p className="text-gray-600 mt-2">
              Manage and continue your personalized learning journeys.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search roadmaps..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={() => navigate('/')}
              className="bg-lwai-deepBlue w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Roadmap
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                <div className="mt-2 flex gap-2">
                  <Button onClick={retryLoading} variant="outline" size="sm">
                    Try Again
                  </Button>
                  
                  {process.env.NODE_ENV !== 'production' && (
                    <Button 
                      onClick={handleCreateTestRoadmap} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
                    >
                      <Bug className="h-3 w-3" />
                      Create Test Roadmap
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center my-12">
              <Loader2 className="h-12 w-12 animate-spin text-lwai-deepBlue" />
            </div>
          ) : filteredRoadmaps.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-lwai-deepBlue opacity-70" />
              </div>
              <h3 className="text-xl font-bold text-lwai-deepBlue">No roadmaps found</h3>
              <p className="text-gray-600 mt-2 max-w-md mx-auto">
                {searchQuery.trim() !== '' 
                  ? "No roadmaps match your search criteria. Try a different search term."
                  : "You haven't created any learning roadmaps yet. Create your first roadmap to get started!"}
              </p>
              {searchQuery.trim() === '' && (
                <Button 
                  onClick={() => navigate('/')}
                  className="mt-6 bg-lwai-deepBlue"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Roadmap
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoadmaps.map((roadmap) => (
                <div 
                  key={roadmap.id} 
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => handleOpenRoadmap(roadmap.id)}
                  >
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded-full">
                      {formatDate(roadmap.createdAt)}
                    </span>
                    <h3 className="text-lg font-bold text-lwai-deepBlue mt-2">{roadmap.topic}</h3>
                    <div className="flex items-center mt-3">
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-lwai-skyBlue h-full" 
                          style={{ width: `${roadmap.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-600">{roadmap.progress || 0}%</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 p-3 flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(roadmap);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredRoadmaps.length === 0 && searchQuery.trim() === '' && process.env.NODE_ENV !== 'production' && (
            <div className="mt-8 text-center">
              <Button 
                onClick={handleCreateTestRoadmap} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
              >
                <Bug className="h-3 w-3" />
                Create Test Roadmap (Debug)
              </Button>
            </div>
          )}
        </main>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Roadmap</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this roadmap for "{roadmapToDelete?.topic}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoadmapsPage; 