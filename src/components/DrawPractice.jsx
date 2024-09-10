import React, { useState, useEffect } from 'react';
import { Tldraw } from '@tldraw/tldraw';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import BasicShapes from './lessons/beginner/BasicShapes';
import DrawingCanvas from './DrawingCanvas';

const DrawingTool = () => {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <DrawingCanvas />
    </div>
  );
};

const LessonContent = ({ lesson }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{lesson.title}</CardTitle>
        <CardDescription>{lesson.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <p>{lesson.content}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => console.log(`Practice ${lesson.title}`)}>Practice</Button>
      </CardFooter>
    </Card>
  );
};

const DrawingLearningSystem = () => {
  const [currentLevel, setCurrentLevel] = useState('beginner');
  const [progress, setProgress] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState({ title: "Basic Shapes", description: "Learn to draw circles, squares, and triangles", content: <BasicShapes /> });

  const levels = {
    beginner: [
      { title: "Basic Shapes", description: "Learn to draw circles, squares, and triangles", content: <BasicShapes /> },
      { title: "Line Control", description: "Master straight lines and curves", content: "Practice drawing straight lines without rulers. Start with short lines and gradually increase their length. For curves, begin with gentle arcs and progress to more complex curved shapes. Focus on maintaining consistent pressure and speed." },
      { title: "Shading Techniques", description: "Introduction to basic shading", content: "Learn how to create depth with simple shading techniques. Start with hatching (parallel lines) and cross-hatching. Then practice gradual shading from light to dark. Apply these techniques to your basic shapes to create the illusion of form." },
    ],
    intermediate: [
      { title: "Perspective Drawing", description: "Understand one and two-point perspective", content: "Begin with one-point perspective drawings. Practice drawing cubes and rectangular prisms vanishing to a single point. Then move on to two-point perspective, focusing on cityscapes or room interiors. Pay attention to how lines converge at vanishing points." },
      { title: "Figure Drawing Basics", description: "Learn human proportions and stick figures", content: "Start by drawing basic stick figures to understand proportions. Practice the 'head-height' method, where an average human body is about 7-8 heads tall. Gradually add volume to your stick figures, turning them into simplified human forms." },
      { title: "Still Life Composition", description: "Create balanced still life drawings", content: "Arrange simple objects and practice drawing them as a group. Focus on the relationships between objects, their proportions, and how they overlap. Pay attention to negative space (the area around and between objects) as much as the objects themselves." },
    ],
    advanced: [
      { title: "Advanced Anatomy", description: "Detailed human anatomy drawing", content: "Study and draw complex muscle groups. Focus on how muscles attach to bones and how they change shape during movement. Practice drawing hands, feet, and facial features in detail. Understanding the underlying structure is key to creating realistic human figures." },
      { title: "Dynamic Poses", description: "Capture movement in your drawings", content: "Practice quick gesture drawings to capture motion. Start with 30-second poses and gradually increase duration. Focus on the flow of the pose and the main lines of action. Then add detail while maintaining the energy of the initial gesture." },
      { title: "Advanced Lighting", description: "Master complex lighting scenarios", content: "Experiment with multiple light sources in your drawings. Practice creating dramatic shadows and highlights. Study how different materials (metal, fabric, skin) react to light. Create drawings that focus on unusual lighting situations, like candlelight or strong backlight." },
    ],
  };

  useEffect(() => {
    // Simulate progress update
    const timer = setInterval(() => {
      setProgress((prevProgress) => (prevProgress >= 100 ? 0 : prevProgress + 10));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Interactive Drawing Learning System</h1>
      <Tabs defaultValue="learn" className="w-full">
        <TabsList>
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="progress">Track Progress</TabsTrigger>
        </TabsList>
        <TabsContent value="learn">
          <div className="mb-4">
            <select
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          {selectedLesson ? (
            <div className="flex h-[calc(100vh-200px)]">
              <div className="w-1/2 pr-2">
                <DrawingTool />
              </div>
              <div className="w-1/2 pl-2">
                <LessonContent lesson={selectedLesson} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levels[currentLevel].map((lesson, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleLessonSelect(lesson)}>
                  <CardHeader>
                    <CardTitle>{lesson.title}</CardTitle>
                    <CardDescription>{lesson.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button onClick={() => handleLessonSelect(lesson)}>Start Lesson</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="progress">
          <h2 className="text-xl font-semibold mb-2">Your Progress</h2>
          <Progress value={progress} className="w-full" />
          <p className="mt-2">You've completed {progress}% of your current level!</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DrawingLearningSystem;