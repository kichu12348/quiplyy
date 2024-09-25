import { useFrame } from "@react-three/fiber/native";
import { Gltf, useGLTF } from "@react-three/drei/native";
import { Suspense, useEffect, useState } from "react";
import Cheese_Slice_Cheese_0 from "../3dModels/Cheese_Slice_Cheese_0.glb";
import Pineapple_Slice_Pineapple_0 from "../3dModels/Pineapple_Slice_Pineapple_0.glb";
import Pizza_Slice_Meat_Feast_0 from "../3dModels/Pizza_Slice_Meat_Feast_0.glb";
import Waffle_Slice_Waffle_0 from "../3dModels/Waffle_Slice_Waffle_0.glb";

const Render3D = ({ item }) => {
  const [rotationZ, setRotationZ] = useState(1);
  const [rotationY, setRotationY] = useState(1);
  const [rotationX, setRotationX] = useState(1);

  useFrame(() => {
    setRotationZ((prev) => prev + 0.01);
    setRotationY((prev) => prev + 0.01);
    setRotationX((prev) => prev + 0.01);
  });

  const [model, setModel] = useState(Cheese_Slice_Cheese_0);

  useEffect(() => {
    setModelToRender();
  }, []);

  const setModelToRender = () => {
    switch (item) {
      case "Cheese":
        setModel(Cheese_Slice_Cheese_0);
        useGLTF.preload(Cheese_Slice_Cheese_0);
        break;
      case "Pineapple":
        setModel(Pineapple_Slice_Pineapple_0);
        useGLTF.preload(Pineapple_Slice_Pineapple_0);
        break;
      case "Waffle":
        setModel(Waffle_Slice_Waffle_0);
        useGLTF.preload(Waffle_Slice_Waffle_0);
        break;
      case "Pizza":
        setModel(Pizza_Slice_Meat_Feast_0);
        useGLTF.preload(Pizza_Slice_Meat_Feast_0);
        break;
      default:
        setModel(Cheese_Slice_Cheese_0);
        useGLTF.preload(Cheese_Slice_Cheese_0);
        break;
    }
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <mesh rotation={[rotationX, rotationY, rotationZ]} scale={5}>
        <Suspense fallback={null}>
          <Gltf src={model} />
        </Suspense>
      </mesh>
    </>
  );
};

export default Render3D;
