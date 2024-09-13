import React, { useState } from "react";
import { Circle, Square, Triangle } from "lucide-react";
import CircleSphereTutorial from "./CircleSphereTutorial";

const Tab = ({ label, icon, isActive, onClick }) => (
  <button
    className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg ${
      isActive ? "bg-white text-blue-600 border-t border-x border-gray-200" : "bg-gray-100 text-gray-600"
    }`}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const ShapeContent = ({ title, description, d2Instructions, d3Instructions, tips, exercises }) => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <p className="mb-6">{description}</p>

    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-3">2D Form: {title}</h3>
      <ul className="list-disc pl-6 space-y-2">
        {d2Instructions.map((instruction, index) => (
          <li key={index}>{instruction}</li>
        ))}
      </ul>
    </div>

    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-3">3D Form: {title.replace("Circle", "Sphere").replace("Square", "Cube").replace("Triangle", "Cone")}</h3>
      <ul className="list-disc pl-6 space-y-2">
        {d3Instructions.map((instruction, index) => (
          <li key={index}>{instruction}</li>
        ))}
      </ul>
    </div>

    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-3">Tips</h3>
      <ul className="list-disc pl-6 space-y-2">
        {tips.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    </div>

    <div>
      <h3 className="text-xl font-semibold mb-3">Practice Exercises</h3>
      <ol className="list-decimal pl-6 space-y-2">
        {exercises.map((exercise, index) => (
          <li key={index}>{exercise}</li>
        ))}
      </ol>
    </div>
  </div>
);

const BasicShapes = () => {
  const [activeTab, setActiveTab] = useState("circle");

  const shapes = [
    {
      id: "circle",
      label: "Circle/Sphere",
      icon: <Circle size={24} />,
      component: <CircleSphereTutorial />,
      content: {
        title: "Circle",
        description: "Circles are the foundation of many organic shapes and are crucial for creating smooth, curved forms.",
        d2Instructions: [
          "Start with a light, circular motion to sketch the basic shape.",
          "Focus on maintaining even pressure and consistent curvature.",
          "Practice drawing circles of various sizes.",
          "Use cross-contour lines to give the circle a sense of volume.",
        ],
        d3Instructions: [
          "To create a sphere, start with a circle and add shading to create the illusion of depth.",
          "Use cross-contour lines that curve around the form to emphasize dimensionality.",
          "Add highlights and shadows to enhance the 3D effect.",
          "Practice drawing spheres from different angles and lighting conditions.",
        ],
        tips: [
          "Use your entire arm to draw larger circles, not just your wrist.",
          "Practice drawing circles in one fluid motion.",
          "For spheres, remember that the shading is gradual, with no hard edges.",
          "Observe real spherical objects to understand how light interacts with the form.",
        ],
        exercises: [
          "Fill a page with circles of various sizes, aiming for consistency in shape.",
          "Draw a series of overlapping circles and shade them to create spheres.",
          "Create a still life composition using only circular and spherical objects.",
          "Practice drawing cross-contour lines on circles to prepare for sphere shading.",
        ],
      },
    },
    {
      id: "square",
      label: "Square/Cube",
      icon: <Square size={24} />,
      content: {
        title: "Square",
        description: "Squares and cubes are the basis for many man-made objects and architectural forms.",
        d2Instructions: [
          "Begin with light, straight lines to outline the square.",
          "Focus on making all sides equal in length.",
          "Use diagonal guidelines to ensure corners are at right angles.",
          "Practice drawing squares at different angles and rotations.",
        ],
        d3Instructions: [
          "Start with a square as the front face of the cube.",
          "Add parallel lines from the corners to create the illusion of depth.",
          "Connect the lines to form the back face of the cube.",
          "Use shading to emphasize the different planes of the cube.",
        ],
        tips: [
          "Use a ruler initially if you struggle with straight lines, but practice freehand as well.",
          "Pay attention to negative space when drawing multiple squares or cubes.",
          "For cubes, remember that parallel lines in 3D space appear to converge at vanishing points.",
          "Study perspective drawing to improve your cube representations.",
        ],
        exercises: [
          "Draw a grid of squares, focusing on consistency in size and shape.",
          "Create a composition of overlapping squares and shade them to look like cubes.",
          "Practice drawing cubes from different angles and in various perspective views.",
          "Design a simple building or structure using only squares and cubes.",
        ],
      },
    },
    {
      id: "triangle",
      label: "Triangle/Cone",
      icon: <Triangle size={24} />,
      content: {
        title: "Triangle",
        description: "Triangles are versatile shapes that can add dynamism and stability to compositions.",
        d2Instructions: [
          "Start with a base line and then add two more lines to form the triangle.",
          "Practice drawing different types of triangles: equilateral, isosceles, and scalene.",
          "Use light guidelines to ensure accurate angles.",
          "Experiment with triangles of different sizes and orientations.",
        ],
        d3Instructions: [
          "Begin with a triangle as the base of the cone.",
          "Add curved lines from the base to a point to create the cone's surface.",
          "Use shading to emphasize the curved surface of the cone.",
          "Practice drawing cones from different angles, including the view from above.",
        ],
        tips: [
          "Use a protractor initially to understand angles, but aim to estimate angles freehand with practice.",
          "For cones, pay attention to how the curved surface interacts with light.",
          "Remember that the base of a cone isn't always a perfect circle when viewed from an angle.",
          "Study how triangles and cones appear in nature and architecture for inspiration.",
        ],
        exercises: [
          "Create a tessellation pattern using only triangles.",
          "Draw a series of cones with different proportions (tall and narrow vs. short and wide).",
          "Design a simple landscape using triangular shapes for mountains or trees.",
          "Practice shading cones under different lighting conditions.",
        ],
      },
    },
  ];

  if (1 == 1) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex border-b border-gray-200">
        {shapes.map((shape) => (
          <Tab key={shape.id} label={shape.label} icon={shape.icon} isActive={activeTab === shape.id} onClick={() => setActiveTab(shape.id)} />
        ))}
      </div>

      {shapes.map((shape) => activeTab === shape.id && (shape.component ?? <ShapeContent key={shape.id} {...shape.content} />))}

      <div className="p-6 bg-gray-100 text-center">
        <p className="text-gray-600">Remember, consistent practice is key to improving your drawing skills. Try to draw every day!</p>
      </div>
    </div>
  );
};

export default BasicShapes;
