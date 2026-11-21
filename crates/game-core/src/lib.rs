use wasm_bindgen::prelude::*;
#[wasm_bindgen]
pub struct SurvivalState{health:f32,hunger:f32,thirst:f32,stamina:f32,body_temp:f32,wetness:f32}
#[wasm_bindgen]
impl SurvivalState{
 #[wasm_bindgen(constructor)] pub fn new()->Self{Self{health:100.,hunger:100.,thirst:100.,stamina:100.,body_temp:37.,wetness:0.}}
 pub fn tick(&mut self,dt:f32,sprinting:bool,ambient:f32,sheltered:bool){let d=dt.clamp(0.,0.25);self.hunger=(self.hunger-d*0.055).max(0.);self.thirst=(self.thirst-d*if ambient>29.{0.105}else{0.075}).max(0.);self.stamina=if sprinting{(self.stamina-d*13.).max(0.)}else{(self.stamina+d*8.).min(100.)};let exposure=if sheltered{0.18}else{1.};let target=37.+(ambient-22.)*0.12*exposure-self.wetness*1.2;self.body_temp+=(target-self.body_temp)*d*0.018;if self.body_temp<35.||self.body_temp>39.{self.health=(self.health-d*0.12).max(0.);}if self.hunger<8.||self.thirst<8.{self.health=(self.health-d*0.22).max(0.);}}
 pub fn eat(&mut self,n:f32){self.hunger=(self.hunger+n.max(0.)).min(100.);}
 pub fn drink(&mut self,n:f32){self.thirst=(self.thirst+n.max(0.)).min(100.);}
 pub fn heal(&mut self,n:f32){self.health=(self.health+n.max(0.)).min(100.);}
 pub fn set_wetness(&mut self,n:f32){self.wetness=n.clamp(0.,1.);}
 pub fn health(&self)->f32{self.health} pub fn hunger(&self)->f32{self.hunger} pub fn thirst(&self)->f32{self.thirst} pub fn stamina(&self)->f32{self.stamina} pub fn body_temp(&self)->f32{self.body_temp}
}
