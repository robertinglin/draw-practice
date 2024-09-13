import React, { useState } from "react";
import { Circle } from "lucide-react";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    {children}
  </div>
);

const Subsection = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    {children}
  </div>
);

const CircleSphereTutorial = () => {
  const [activeSection, setActiveSection] = useState("2d");

  if (1 == 1) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 bg-gray-100">
        <h1 className="text-3xl font-bold mb-4 text-center">Mastering Circles and Spheres</h1>
        <p className="text-center">Learn to draw perfect circles, create convincing spheres, and manipulate these forms for dynamic artworks.</p>
      </div>

      <div className="flex border-b border-gray-200">
        {["2d", "3d", "deforming"].map((section) => (
          <button
            key={section}
            className={`flex-1 py-2 px-4 font-semibold ${
              activeSection === section ? "bg-white border-b-2 border-blue-500 text-blue-500" : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setActiveSection(section)}
          >
            {section === "2d" ? "2D Circles" : section === "3d" ? "3D Spheres" : "Deforming Shapes"}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeSection === "2d" && (
          <>
            <Section title="Drawing Perfect Circles">
              <Subsection title="Understanding the Circle">
                <p>
                  A circle is a perfectly round shape where all points are equidistant from the center. Mastering the circle is crucial for many aspects of
                  drawing, from creating organic forms to precise technical illustrations.
                </p>
              </Subsection>

              <Subsection title="Techniques for Drawing Circles">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Arm movement:</strong> Use your entire arm, not just your wrist, for smoother, more consistent circles.
                  </li>
                  <li>
                    <strong>Light touch:</strong> Begin with light, loose circular motions to establish the basic shape.
                  </li>
                  <li>
                    <strong>Gradual refinement:</strong> Slowly refine your circle, making small adjustments with each pass.
                  </li>
                  <li>
                    <strong>Pivot point:</strong> Keep your pinky on the paper as a pivot point for stability when drawing smaller circles.
                  </li>
                  <li>
                    <strong>Rhythm:</strong> Develop a steady rhythm as you draw to maintain consistent curvature.
                  </li>
                </ol>
              </Subsection>

              <Subsection title="Common Mistakes and How to Avoid Them">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Flat spots:</strong> Caused by drawing too slowly. Increase your speed for smoother curves.
                  </li>
                  <li>
                    <strong>Egg shapes:</strong> Often a result of uneven pressure. Practice maintaining consistent pressure throughout the stroke.
                  </li>
                  <li>
                    <strong>Spirals:</strong> Happen when you don't close the circle properly. Focus on connecting the start and end points smoothly.
                  </li>
                </ul>
              </Subsection>

              <Subsection title="Practice Exercises">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Draw 100 circles of various sizes on a single page, focusing on consistency.</li>
                  <li>Create concentric circles, maintaining even spacing between each ring.</li>
                  <li>Draw circles using only your shoulder movement, then only your elbow, and compare the results.</li>
                  <li>Practice drawing perfect circles clockwise, then counterclockwise, and note any differences.</li>
                </ol>
              </Subsection>
            </Section>
          </>
        )}

        {activeSection === "3d" && (
          <>
            <Section title="Creating Convincing Spheres">
              <Subsection title="From Circle to Sphere">
                <p>
                  A sphere is the three-dimensional equivalent of a circle. Creating the illusion of a sphere on a flat surface requires understanding of form,
                  light, and shadow.
                </p>
              </Subsection>

              <Subsection title="Techniques for Drawing Spheres">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Basic outline:</strong> Start with a perfect circle as your base.
                  </li>
                  <li>
                    <strong>Establish light source:</strong> Decide where your light is coming from before shading.
                  </li>
                  <li>
                    <strong>Core shadow:</strong> Add the darkest shadow on the side opposite the light source.
                  </li>
                  <li>
                    <strong>Midtones:</strong> Gradually blend the shadow into midtones towards the light.
                  </li>
                  <li>
                    <strong>Highlight:</strong> Leave the area where light hits directly as the brightest part.
                  </li>
                  <li>
                    <strong>Reflected light:</strong> Add a subtle light area on the shadow side to show reflected light.
                  </li>
                  <li>
                    <strong>Cast shadow:</strong> Draw the shadow the sphere casts on the surface it's sitting on.
                  </li>
                </ol>
              </Subsection>

              <Subsection title="Advanced Techniques">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Cross-contour lines:</strong> Use curved lines across the surface to emphasize the form.
                  </li>
                  <li>
                    <strong>Texture:</strong> Add surface texture (like for a tennis ball or orange) while maintaining the spherical form.
                  </li>
                  <li>
                    <strong>Multiple light sources:</strong> Practice creating spheres with complex lighting scenarios.
                  </li>
                </ul>
              </Subsection>

              <Subsection title="Practice Exercises">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Draw a series of spheres with the light source in different positions.</li>
                  <li>Create a still life with multiple spherical objects (e.g., fruits) and practice shading them.</li>
                  <li>Draw a sphere in different environments and reflect the surrounding colors in its surface.</li>
                  <li>Practice drawing transparent or reflective spheres, like bubbles or crystal balls.</li>
                </ol>
              </Subsection>
            </Section>
          </>
        )}

        {activeSection === "deforming" && (
          <>
            <Section title="Deforming Circles and Spheres">
              <Subsection title="Understanding Deformation">
                <p>
                  Deforming circles and spheres allows you to create more complex and dynamic shapes. This skill is crucial for drawing organic forms, creating
                  movement, and adding interest to your artwork.
                </p>
              </Subsection>

              <Subsection title="Techniques for Deforming">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Stretching:</strong> Elongate the circle in one direction to create ovals or ellipses.
                  </li>
                  <li>
                    <strong>Squashing:</strong> Compress the circle to create flattened forms.
                  </li>
                  <li>
                    <strong>Bending:</strong> Curve the circle's form to create arcs or crescent shapes.
                  </li>
                  <li>
                    <strong>Pinching:</strong> Create points or sharp edges in your circular forms.
                  </li>
                  <li>
                    <strong>Bulging:</strong> Expand certain areas of the circle to create irregular rounded shapes.
                  </li>
                </ol>
              </Subsection>

              <Subsection title="Applying Deformation to Spheres">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Maintain volume:</strong> When deforming a sphere, ensure the overall volume remains consistent.
                  </li>
                  <li>
                    <strong>Adjust shading:</strong> Modify your shading technique to reflect the new form of the deformed sphere.
                  </li>
                  <li>
                    <strong>Use cross-contour:</strong> Emphasize the deformation by adjusting your cross-contour lines.
                  </li>
                </ul>
              </Subsection>

              <Subsection title="Practical Applications">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Character design:</strong> Use deformed circles for cartoon character bodies or facial features.
                  </li>
                  <li>
                    <strong>Natural forms:</strong> Create organic shapes like water droplets, pebbles, or cloud formations.
                  </li>
                  <li>
                    <strong>Motion studies:</strong> Show movement or impact by deforming circular objects.
                  </li>
                  <li>
                    <strong>Abstract art:</strong> Use deformed circles and spheres as a basis for abstract compositions.
                  </li>
                </ul>
              </Subsection>

              <Subsection title="Practice Exercises">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Draw a series of circles, then deform each one in a different way.</li>
                  <li>Create a "bouncing ball" animation sequence, showing how the sphere deforms upon impact.</li>
                  <li>Design a character using only deformed circles and spheres.</li>
                  <li>Draw a landscape where all elements are based on deformed circular shapes.</li>
                </ol>
              </Subsection>
            </Section>
          </>
        )}
      </div>

      <div className="p-6 bg-gray-100 text-center">
        <p className="text-gray-600">
          Remember, mastering circles and spheres takes time and practice. Don't get discouraged – keep drawing and experimenting with these forms every day!
        </p>
      </div>
    </div>
  );
};

export default CircleSphereTutorial;
