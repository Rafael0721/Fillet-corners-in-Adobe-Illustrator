# Fillet-corners-in-Adobe-Illustrator
Making different type of fillet with JavaScript in Adobe Illustrator<br />
This method requires three coordinates(x, y) and the radius of fillet.<br />

The JSX file contains different types of fillet, including normal-type, dog-bone, type-A, type-B, type-H, type-I.<br />
dog-bone is the basic form of all types.

Each type includes the following steps:
1. Extracting points data from the pathItems/compoundItems.
2. Recording each path/compoundPath data with the same order as the extracted points. (For final merge)
3. Finding the right position(center point) to add circles based on each corner.

   >>Finding the bisector line first

   >>Then using similar triangles to check coordinates of center points.

   ![sketch4](https://user-images.githubusercontent.com/14371547/82036939-7221a300-96dc-11ea-9d0c-741f76c10601.jpg)<br />
   AB:AC = BD:DC<br />

   ![sketch1](https://user-images.githubusercontent.com/14371547/82037008-89f92700-96dc-11ea-9955-eba8136153cf.jpg)<br />
   Get the coordinate of point D(x, y)<br />

   ![sketch2](https://user-images.githubusercontent.com/14371547/82037043-98474300-96dc-11ea-976c-5f90d9d1a543.jpg)<br />
   AO(radius of fillet):AD = OG:DH = AG:AH<br />
   Get the coordinate of point O(x, y) -> the center point<br />

4. (Optional) Checking the vector of each corner by Cross product(+ or -).
   >> Reference: https://en.wikipedia.org/wiki/Cross_product

5. Generating circles & group with recorded path/compoundPath data.
6. app.ExecuteMenuCommand("Live Pathfinder Subtract") for each group.
   ![123](https://user-images.githubusercontent.com/14371547/82038052-edd01f80-96dd-11ea-9491-9a4f9c4adb00.JPG)<br />

# How to use
To call this fillet function, use fillet( "Diameter/Type" ); in your client index.js file<br />

Diameter can be any integer. <br />

Type includes "dog", "typeA", "typeB", "typeH", "typeI" and "normalFillet". <br />

for an example: fillet( "6.35/dog" );
