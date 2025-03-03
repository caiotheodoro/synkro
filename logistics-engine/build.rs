use std::io::Result;

fn main() -> Result<()> {
    tonic_build::compile_protos("proto/order_service.proto")?;
    tonic_build::compile_protos("proto/inventory_service.proto")?;
    Ok(())
}
